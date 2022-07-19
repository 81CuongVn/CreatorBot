const { ContextMenuInteraction, ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const mongo = require('../../../mongo');
const timerSchema = require('../../../schemas/misc/timer_schema');
const path = require('path');

module.exports = {
    name: `resetspotlight`,
    description: `Resets the content spotlight channel`,
    access: 'staff',
    cooldown: 3,
    type: ApplicationCommandType.ChatInput,
    usage: `/resetspotlight`,
    /**
     * 
     * @param {ContextMenuInteraction} interaction 
     */
    async execute(interaction) {
        const { guild } = interaction;

        const ckqChannel = guild.channels.cache.get(process.env.CKQ_CHAN);
        const ckqRole = guild.roles.cache.get(process.env.CKQ_ROLE);

        const ckqEmbed = new EmbedBuilder()
            .setColor('#44eaff') // GREEN
            .setTitle(`:crown: Content Spotlight`)
            .setDescription(`**What Is It?**
Every 5 hours the channel will unlock, allowing everyone to post a single link to their content, the person who claims the channel will also be given the <@&878229140992589906> role. The channel will then be locked again for 5 hours allowing that person's content to be centre of attention`)

        const searchFor = 'currentTime';
        await mongo().then(async mongoose => {
            try {

                setTimeout(() => ckqChannel.bulkDelete(10).catch(err => {
                    console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err)
                }).then(ckqChannel.send({
                    embeds: [ckqEmbed]
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an embed: `, err))), 100);

                setTimeout(() => ckqRole.members.each(member => {
                    member.roles.remove(ckqRole).catch(err => console.error(`${path.basename(__filename)} There was a problem removing a role: `, err));
                }), 200);

                setTimeout(() => ckqChannel.permissionOverwrites.edit(guild.id, {
                    SendMessages: true,
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err)), 300);

                await timerSchema.findOneAndRemove({ searchFor });

                await timerSchema.findOneAndUpdate({
                    timestamp: 'null',
                    searchFor
                }, {
                    timestamp: 'null',
                    searchFor
                }, {
                    upsert: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));

            } finally {
                // do nothing
            }
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem connecting to the database: `, err))
            .then(interaction.reply({
                content: `${[process.env.BOT_CONF]} \`#${ckqChannel.name} has been reset\``,
                ephemeral: true
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err)))
    }
}