const {ContextMenuInteraction, Modal, TextInputComponent, MessageActionRow} = require('discord.js');
const massbanSchema = require('../../../schemas/misc/mass_ban_schema');
const {oneDay} = require('../../../modules/mods_choice/mods_choice_constants')
const path = require('path');
const {MessageEmbed} = require('discord.js');

/**
 * Deny a mass ban request.
 *
 * @param {ContextMenuInteraction} interaction
 * @param {String} users The users to ban
 * @param {String} reason The reason for banning the users
 */
async function banUsers(interaction, users, reason) {
    let {guild} = interaction;

    const userList = users.split(/\r?\n/);
    let fetchedMemberArrays = await guild.members.fetch();
    let bannedUsers = [];
    let skippedUsers = [];
    for (let fetchedMemberArray of fetchedMemberArrays) {
        let fetchedMember = fetchedMemberArray[1];
        let memberTag = fetchedMember?.user?.tag;
        if (userList.includes(memberTag)) {
            let joinedAt = fetchedMember.joinedTimestamp;
            if ((new Date() - joinedAt) > oneDay) {
                console.log(`${path.basename(__filename)} Member ${memberTag} was not banned as they joined more than 1 day ago.`);
                skippedUsers.push(memberTag);
            } else {
                console.log(`${path.basename(__filename)} Banning ${memberTag} who joined at ${new Date(joinedAt).toISOString()}.`);
                bannedUsers.push(memberTag);
                await fetchedMember.ban({reason: reason, days: 7})
                    .catch(err => console.error(`${path.basename(__filename)} Failed to ban user ${memberTag}: `, err));
            }
        }
    }
    return {skippedUsers: skippedUsers, bannedUsers: bannedUsers}
}

/**
 * Deny a mass ban request.
 *
 * @param {ContextMenuInteraction} interaction
 */
async function approveMassBan(interaction) {
    let {member, guild, options} = interaction;
    let id = options.getString('id');

    let result = await massbanSchema.findOne({id: id}).exec()
        .catch(err => console.error(`${path.basename(__filename)} There was a problem fetching away users from the database: `, err));
    if (result && result.state === "PENDING") {
        let author = result.author;
        let currentUser = member.user.tag;

        if (author === currentUser) {
            interaction.reply({
                content: `${process.env.BOT_DENY} \`The mass ban request with ID '${id}' cannot be approved by the same person who requested it.\``,
                ephemeral: true
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
        } else {
            const staffChannel = guild.channels.cache.get(process.env.STAFF_CHAN);
            let reason = result.reason;

            let banResults = await banUsers(interaction, result.users, reason);

            result.state = "APPROVED";
            result.save();

            let bannedUsers = banResults.bannedUsers.join("\n");
            let skippedUsers = banResults.skippedUsers.join("\n");
            const staffEmbed = new MessageEmbed()
                .setColor('#44ff00')
                .setAuthor({name: `${member?.user.tag}`, iconURL: member?.user.displayAvatarURL({dynamic: true})})
                .setDescription(`Mass Ban Request Processed`)
                .addField("Request ID", id)
                .addField("Reason", reason)
                .addField("Banned Users", bannedUsers ? bannedUsers : "None")
                .addField("Skipped Users", skippedUsers ? skippedUsers : "None");

            staffChannel.send({
                embeds: [staffEmbed]
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));

            interaction.reply({
                content: `${process.env.BOT_CONF} \`The mass ban request with ID '${id}' has been approved.\``,
                ephemeral: true
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
        }
    } else {
        interaction.reply({
            content: `${process.env.BOT_DENY} \`Could not find a pending mass ban request with ID '${id}'.\``,
            ephemeral: true
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
    }
}

/**
 * Approve a mass ban request.
 *
 * @param {ContextMenuInteraction} interaction
 */
async function denyMassBan(interaction) {
    let {options} = interaction;
    let id = options.getString('id');

    let result = await massbanSchema.findOne({id: id}).exec()
        .catch(err => console.error(`${path.basename(__filename)} There was a problem fetching away users from the database: `, err));
    if (result && result.state === "PENDING") {
        result.state = "DENIED";
        result.save();

        interaction.reply({
            content: `${process.env.BOT_CONF} \`The mass ban request with ID '${id}' has been denied.\``,
            ephemeral: true
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
    } else {
        interaction.reply({
            content: `${process.env.BOT_DENY} \`Could not find a pending mass ban request with ID '${id}'.\``,
            ephemeral: true
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
    }
}

/**
 * Create a mass ban request modal.
 *
 * @param {ContextMenuInteraction} interaction
 */
async function createMassBanRequest(interaction) {
    const modal = new Modal()
        .setTitle('Mass Ban Form')
        .setCustomId('massban-modal');

    const usersRow = new MessageActionRow().addComponents([
        new TextInputComponent()
            .setCustomId('user-list')
            .setLabel('User List to Ban (1 per line)')
            .setStyle(1)
            .setPlaceholder('Username and tag (e.g: ProbablyRaging#0001) - 1 per line')
            .setMinLength(1)
            .setMaxLength(1000)
            .setRequired(true)
            .setStyle("PARAGRAPH")
    ]);

    const reasonRow = new MessageActionRow().addComponents([
        new TextInputComponent()
            .setCustomId('reason')
            .setLabel('Reason For Ban')
            .setStyle(1)
            .setPlaceholder('Reason')
            .setMinLength(1)
            .setMaxLength(255)
            .setRequired(true)
            .setStyle("SHORT")
    ]);

    modal.addComponents(usersRow, reasonRow);

    await interaction.showModal(modal);
}

module.exports = {
    name: `massban`,
    description: `Ban a list of users who have been in the server for less than a day.`,
    access: 'staff',
    cooldown: 5,
    type: `CHAT_INPUT`,
    options: [
        {
            name: `create`,
            description: `Create a mass ban of multiple new users.`,
            type: `SUB_COMMAND`,
            usage: `/massban create`
        },
        {
            name: `approve`,
            description: `Approve a mass ban request.`,
            type: `SUB_COMMAND`,
            usage: `/massban approve [id]`,
            options: [{
                name: `id`,
                description: `The mass ban ID to approve.`,
                type: `STRING`,
                required: true
            }]
        },
        {
            name: `deny`,
            description: `Deny a mass ban request.`,
            type: `SUB_COMMAND`,
            usage: `/massban deny [id]`,
            options: [{
                name: `id`,
                description: `The mass ban ID to deny.`,
                type: `STRING`,
                required: true
            }]
        }
    ],

    /**
     *
     * @param {ContextMenuInteraction} interaction
     */
    async execute(interaction) {
        try {
            let {options} = interaction;
            switch (options.getSubcommand()) {
                case 'create': {
                    await createMassBanRequest(interaction);
                    break;
                }
                case 'approve': {
                    await approveMassBan(interaction);
                    break;
                }
                case 'deny': {
                    await denyMassBan(interaction);
                    break;
                }
            }
        } catch (err) {
            console.error(`${path.basename(__filename)} There was a problem while interacting with a mass ban: `, err)
        }

    }
}
