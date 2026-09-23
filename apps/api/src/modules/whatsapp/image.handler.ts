import type { IWhatsAppProvider } from "../../providers/whatsapp/whatsapp.provider.interface.js";
import type { ImageService } from "../images/image.service.js";
import type { OrderService } from "../orders/order.service.js";
import type { ConversationService } from "../conversations/conversation.service.js";

export class WhatsAppImageHandler {
  constructor(
    private whatsapp: IWhatsAppProvider,
    private imageService: ImageService,
    private orderService: OrderService,
    private conversationService: ConversationService,
    private maxImageSizeMB: number,
  ) {}

  async handleImageMessage(from: string, mediaId: string): Promise<void> {
    const state = await this.conversationService.get(from);

    if (!state || state.state !== "WAITING_FOR_IMAGE") {
      await this.whatsapp.sendText(
        from,
        "🤔 Não estou esperando uma foto agora. Digite MENU para começar.",
      );
      return;
    }

    if (!state.productId || !state.orderDraftId) {
      await this.whatsapp.sendText(from, "❌ Erro interno. Digite MENU e tente novamente.");
      await this.conversationService.setState(from, "IDLE");
      return;
    }

    try {
      await this.whatsapp.sendText(from, "📥 Baixando sua foto...");

      const { bytes, mimeType } = await this.whatsapp.downloadMedia(mediaId);

      const validation = this.imageService.validateImage({
        bytes,
        mimeType,
        maxSizeMB: this.maxImageSizeMB,
      });

      if (!validation.valid) {
        await this.whatsapp.sendText(
          from,
          `❌ Imagem inválida: ${validation.error}\n\nEnvie outra foto ou digite CANCELAR.`,
        );
        return;
      }

      await this.whatsapp.sendText(from, "☁️ Enviando para o servidor...");

      const order = await this.orderService.findById(state.orderDraftId);
      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const { key } = await this.imageService.uploadImage({
        bytes,
        mimeType,
        userId: order.userId,
        purpose: "input",
      });

      await this.orderService.setInputImage(state.orderDraftId, key);

      await this.conversationService.setState(from, "IMAGE_RECEIVED", {
        productId: state.productId,
        orderDraftId: state.orderDraftId,
      });

      await this.whatsapp.sendText(
        from,
        [
          "✅ Foto recebida com sucesso!",
          "",
          "💰 Gerando cobrança Pix...",
          "",
          "(Pagamento será implementado na Fase 5)",
        ].join("\n"),
      );
    } catch (error) {
      console.error("Failed to handle image:", error);
      await this.whatsapp.sendText(
        from,
        "❌ Erro ao processar imagem. Tente novamente ou digite CANCELAR.",
      );
    }
  }
}
