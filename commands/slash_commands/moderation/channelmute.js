const { ContextMenuInteraction, ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const muteSchema = require('../../../schemas/misc/mute_schema');
// const muteTimeoutSchema = require('../../../schemas/database_logs/mute_timeout_schema');
const { v4: uuidv4 } = require('uuid');
const path = require('path');


module.exports = {
    name: `channelmute`,
    description: `Mute a user in a specific channel`,
    access: 'staff',
    cooldown: 5,
    type: ApplicationCommandType.ChatInput,
    options: [{
        name: `add`,
        description: `Add a channel mute to a user`,
        type: ApplicationCommandOptionType.Subcommand,
        usage: `/channelmute add [@username] [#channel] [reason]`,
        options: [{
            name: `username`,
            description: `The user you want to mute`,
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: `channel`,
            description: `The channel you want to mute the user in`,
            type: ApplicationCommandOptionType.Channel,
            required: true
        },
        {
            name: `reason`,
            description: `The reason for muting the user`,
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: `duration`,
            description: `Set a duration (IN HOURS) for when the channel mute should expire`,
            type: ApplicationCommandOptionType.String,
            required: false
        }],
    },
    {
        name: `remove`,
        description: `Remove a channel mute from a user`,
        type: ApplicationCommandOptionType.Subcommand,
        usage: `/channelmute remove [@username] [#channel]`,
        options: [{
            name: `username`,
            description: `The user you want to mute`,
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: `channel`,
            description: `The channel you want to mute the user in`,
            type: ApplicationCommandOptionType.Channel,
            required: true
        }],
    }],

    /**
     * 
     * @param {ContextMenuInteraction} interaction 
     */
    async execute(interaction) {
        const { client, member, guild, channel, options } = interaction;

        const logChan = guild.channels.cache.get(process.env.LOG_CHAN);

        switch (options.getSubcommand()) {
            case 'add': {
                const target = options.getMember('username');
                const targetChan = options.getChannel('channel');
                const reason = options.getString('reason');
                let duration = options.getString('duration') || `0`;

                if (reason && reason.length > 1024) {
                    return interaction.reply({
                        content: `${process.env.BOT_DENY} Reasons are limited to 1024 characters`,
                        ephemeral: true
                    }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
                }

                targetChan.permissionOverwrites.edit(target.id, {
                    SendMessages: false,
                }).catch(err => { return console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err) });

                if (duration > 0) {
                    const myDate = new Date();
                    const timestamp = myDate.setHours(myDate.getHours() + parseInt(duration));

                    await muteSchema.findOneAndUpdate({
                        timestamp,
                        userId: target.id,
                        channelId: channel.id
                    }, {
                        timestamp,
                        userId: target.id,
                        channelId: channel.id
                    }, {
                        upsert: true
                    }).catch(err => { return console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err) });
                }

                if (!duration || duration === '0') {
                    duration = 'Permanent';
                } else {
                    if (duration > 1) {
                        duration = `${duration} hours`;
                    } else {
                        duration = `${duration} hour`;
                    }
                }

                // Log to channel
                let log = new EmbedBuilder()
                    .setColor("#E04F5F")
                    .setAuthor({ name: `${member?.user.tag}`, iconURL: member?.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`**Member:** ${target?.user.tag} *(${target?.user.id})*
**Channel:** ${targetChan}
**Duration:** ${duration}
**Reason:** ${reason}`)
                    .setFooter({ text: `Channel Mute • ${uuidv4()}`, iconURL: 'https://www.creatorhub.info/images/creatorhub/mute_icon.png' })
                    .setTimestamp();

                logChan.send({
                    embeds: [log]
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an embed: `, err));

                // Log to database for dashboard
                // const logTimestamp = new Date().getTime();

                // await muteTimeoutSchema.create({
                //     userId: target?.user.id,
                //     username: target?.user.tag,
                //     author: member?.id,
                //     authorTag: `${member?.user.tag}`,
                //     reason: reason,
                //     timestamp: logTimestamp,
                //     type: 'Channel Mute'
                // });

                interaction.reply({
                    content: `${process.env.BOT_CONF} ${target} was muted in ${targetChan}`,
                    ephemeral: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
            }
        }

        switch (options.getSubcommand()) {
            case 'remove': {
                const target = options.getMember('username');
                const targetChan = options.getChannel('channel');

                targetChan.permissionOverwrites.edit(target.id, {
                    SendMessages: null,
                }).catch(err => { return console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err) });

                // Log to channel
                let log = new EmbedBuilder()
                    .setColor("#4fe059")
                    .setAuthor({ name: `${member?.user.tag}`, iconURL: member?.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`**Member:** ${target?.user.tag} *(${target?.user.id})*
**Channel:** ${targetChan}`)
                    .setFooter({ text: `Channel Unmute • ${uuidv4()}`, iconURL: 'https://www.creatorhub.info/images/creatorhub/unmute_icon.png' })
                    .setTimestamp();

                logChan.send({
                    embeds: [log]
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an embed: `, err));

                interaction.reply({
                    content: `${process.env.BOT_CONF} ${target} was unmuted in ${targetChan}`,
                    ephemeral: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
            }
        }
    }
}