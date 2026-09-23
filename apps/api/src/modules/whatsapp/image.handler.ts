import type { IWhatsAppProvider } from "../../providers/whatsapp/whatsapp.provider.interface.js";
import type { ImageService } from "../images/image.service.js";
import type { OrderService } from "../orders/order.service.js";
import type { ConversationService } from "../conversations/conversation.service.js";
import type { PaymentFlowService } from "../payment/payment-flow.service.js";

export class WhatsAppImageHandler {
  constructor(
    private whatsapp: IWhatsAppProvider,
    private imageService: ImageService,
    private orderService: OrderService,
    private conversationService: ConversationService,
    private paymentFlowService: PaymentFlowService,
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

      await this.orderService.transitionStatus(state.orderDraftId, "PENDING_PAYMENT");

      await this.whatsapp.sendText(from, "✅ Foto recebida! Gerando cobrança Pix...");

      const pix = await this.paymentFlowService.createPixForOrder(state.orderDraftId);

      const expirationText = this.formatExpiration(pix.expiresAt);

      await this.whatsapp.sendText(
        from,
        [
          "💰 Pagamento Pix gerado!",
          "",
          `Valor: R$ ${(await this.orderService.findById(state.orderDraftId))!.amountCents / 100}`,
          "",
          "🔐 Copie o código Pix:",
          pix.pixCode,
          "",
          `⏱️ Válido até: ${expirationText}`,
          "",
          "✅ Após o pagamento, sua imagem será processada automaticamente.",
        ].join("\n"),
      );

      await this.conversationService.setState(from, "WAITING_PAYMENT", {
        productId: state.productId,
        orderDraftId: state.orderDraftId,
      });
    } catch (error) {
      console.error("Failed to handle image:", error);
      await this.whatsapp.sendText(
        from,
        "❌ Erro ao processar imagem. Tente novamente ou digite CANCELAR.",
      );
    }
  }

  private formatExpiration(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${date.toLocaleDateString("pt-BR")} às ${hours}:${minutes}`;
  }
}
