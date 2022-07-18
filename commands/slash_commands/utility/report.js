require("dotenv").config();
const { addAttachment } = require("../../../modules/misc/report_attachment");
const { ContextMenuInteraction, ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, TextInputBuilder, ModalBuilder } = require("discord.js");

module.exports = {
    name: "report",
    description: "Report a user to the CreatorHub staff",
    access: '',
    cooldown: 60,
    type: ApplicationCommandType.ChatInput,
    usage: `/report [@username] [reason] (imageURL)`,
    options: [
        {
            name: "proof",
            description: "Provide proof of your report",
            type: ApplicationCommandOptionType.Attachment,
            required: true
        }
    ],
    /**
     * 
     * @param {ContextMenuInteraction} interaction 
     */
    async execute(interaction) {
        const { options } = interaction;

        const attachment = options.getAttachment('proof')
        
        addAttachment(1, attachment.url);

        const modal = new ModalBuilder()
            .setTitle('Report Form')
            .setCustomId('report-modal')

        const input1 = new TextInputBuilder()
            .setCustomId('input1')
            .setLabel('Username')
            .setStyle(1)
            .setPlaceholder('Username and tag (e.g: ProbablyRaging#0001')
            .setMinLength(1)
            .setMaxLength(54)
            .setRequired(true)

        const input2 = new TextInputBuilder()
            .setCustomId('input2')
            .setLabel('Reason')
            .setStyle(2)
            .setPlaceholder('Please include a reason for your report..')
            .setMinLength(1)
            .setMaxLength(1024)
            .setRequired(true)

        const row1 = new ActionRowBuilder().addComponents([input1]);
        const row2 = new ActionRowBuilder().addComponents([input2]);

        modal.addComponents(row1, row2);

        await interaction.showModal(modal);
    }
};
