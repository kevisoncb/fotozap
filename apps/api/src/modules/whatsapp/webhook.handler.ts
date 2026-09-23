import type { FastifyRequest, FastifyReply } from "fastify";
import type { IWhatsAppProvider } from "../../providers/whatsapp/whatsapp.provider.interface.js";
import type { BotService } from "./bot.service.js";
import type { MessageService } from "../messages/message.service.js";
import type { UserService } from "../users/user.service.js";
import type { WhatsAppWebhookPayload } from "../../providers/whatsapp/whatsapp.provider.interface.js";
import type { WhatsAppImageHandler } from "./image.handler.js";

export class WhatsAppWebhookHandler {
  constructor(
    private whatsapp: IWhatsAppProvider,
    private bot: BotService,
    private messageService: MessageService,
    private userService: UserService,
    private imageHandler: WhatsAppImageHandler,
  ) {}

  async handleVerification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { mode, challenge, verify_token } = request.query as {
      mode?: string;
      challenge?: string;
      verify_token?: string;
    };

    if (!mode || !challenge || !verify_token) {
      reply.code(400).send({ error: "Missing parameters" });
      return;
    }

    const result = this.whatsapp.verifyWebhook(mode, verify_token, challenge);

    if (result) {
      reply.code(200).send(result);
    } else {
      reply.code(403).send({ error: "Verification failed" });
    }
  }

  async handleWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const signature = request.headers["x-hub-signature-256"] as string | undefined;
    const body = JSON.stringify(request.body);

    if (!signature) {
      reply.code(400).send({ error: "Missing signature" });
      return;
    }

    if (!this.whatsapp.validateWebhookSignature(signature, body)) {
      reply.code(403).send({ error: "Invalid signature" });
      return;
    }

    reply.code(200).send({ success: true });

    setImmediate(async () => {
      try {
        await this.processWebhook(request.body as WhatsAppWebhookPayload);
      } catch (error) {
        request.log.error({ error }, "Failed to process WhatsApp webhook");
      }
    });
  }

  private async processWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    if (payload.object !== "whatsapp_business_account") {
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") {
          continue;
        }

        const { value } = change;

        if (value.messages) {
          for (const message of value.messages) {
            await this.handleIncomingMessage(message);
          }
        }
      }
    }
  }

  private async handleIncomingMessage(
    message: WhatsAppWebhookPayload["entry"][0]["changes"][0]["value"]["messages"][0],
  ): Promise<void> {
    if (!message) return;

    const user = await this.userService.findOrCreate({
      whatsappPhone: message.from,
    });

    await this.messageService.create({
      userId: user.id,
      externalMessageId: message.messageId,
      direction: "INBOUND",
      type: message.type,
      content: message.text?.body,
      mediaId: message.image?.id,
    });

    if (message.type === "text" && message.text?.body) {
      await this.bot.handleMessage(message.from, message.messageId, message.text.body);
    } else if (message.type === "image" && message.image?.id) {
      await this.imageHandler.handleImageMessage(message.from, message.image.id);
    } else {
      await this.whatsapp.sendText(
        message.from,
        "🤖 Tipo de mensagem não suportado. Envie texto ou imagem.",
      );
    }
  }
}
