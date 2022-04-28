const { ContextMenuInteraction, MessageEmbed } = require('discord.js');
const path = require('path');

module.exports = {
    name: `about`,
    description: `Information about CreatorBot`,
    cooldown: 5,
    type: `CHAT_INPUT`,
    usage: `/about`,
    /**
     * 
     * @param {ContextMenuInteraction} interaction 
     */
    execute(interaction) {
        const { client, guild } = interaction;

        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        let botUptime = `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;

        const response = new MessageEmbed()
            .setColor('#32BEA6')
            .setAuthor({ name: `${client.user.tag}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`Created by ${process.env.OWNER_ID} for [**CreatorHub**](https://discord.gg/creatorhub)

Maintained by:
<@${process.env.OWNER_ID}> - [YouTube](https://www.youtube.com/ProbablyRaging) - [GitHub](https://github.com/ProbablyRaging)
<@878608494499098694> - [YouTube](https://www.youtube.com/HighTechLowIQ) - [GitHub](https://github.com/HighTechLowIQ)
      
Uptime: \`${botUptime}\``)
            .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp()

        interaction.reply({
            embeds: [response],
            ephemeral: true
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
    }
}