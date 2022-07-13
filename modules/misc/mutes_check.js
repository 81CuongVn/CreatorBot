const { MessageEmbed } = require('discord.js');
const mongo = require('../../mongo');
const muteSchema = require('../../schemas/misc/mute_schema');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

module.exports = async (message, client, Discord) => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const logChan = guild.channels.cache.get(process.env.LOG_CHAN);

    setInterval(async () => {
        await mongo().then(async mongoose => {
            try {
                const results = await muteSchema.find({ timestamp: { $gt: 0 } }).catch(err => { return console.error(`${path.basename(__filename)} There was a problem finding a database entry: `, err) });

                for (const data of results) {
                    const { timestamp, userId, channelId } = data;

                    const myDate = new Date();
                    const nowTime = myDate.setSeconds(myDate.getSeconds() + 1);

                    if (nowTime > timestamp) {
                        await muteSchema.findOneAndRemove({ userId }).catch(err => { return console.error(`${path.basename(__filename)} There was a problem removing a database entry: `, err) });

                        const target = client.users.cache.get(userId);
                        const targetChan = guild.channels.cache.get(channelId);

                        targetChan.permissionOverwrites.edit(target.id, {
                            SEND_MESSAGES: null,
                        }).catch(err => { return console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err) });

                        // Log to channel
                        let log = new MessageEmbed()
                            .setColor("#E04F5F")
                            .setAuthor({ name: `${client?.user.tag}`, iconURL: client?.user.displayAvatarURL({ dynamic: true }) })
                            .setDescription(`**Member:** ${target?.tag} *(${target?.id})*
**Channel:** ${targetChan}`)
                            .setFooter({ text: `Channel Unmute • ${uuidv4()}`, iconURL: 'https://www.creatorhub.info/images/creatorhub/unmute_icon.png' })
                            .setTimestamp();

                        logChan.send({
                            embeds: [log]
                        }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an embed: `, err));

                        target?.send({
                            content: `${process.env.BOT_DENY} \`You have been unmuted in #${targetChan.name} on ${guild.name}\``
                        }).catch(err => { return; })
                    }
                }
            } finally {
                // do nothing
            }
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem connecting to the database: `, err));
    }, 30000);
}