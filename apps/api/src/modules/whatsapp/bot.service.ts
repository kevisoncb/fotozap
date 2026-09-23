import type { IWhatsAppProvider } from "../../providers/whatsapp/whatsapp.provider.interface.js";
import type { ConversationService } from "../conversations/conversation.service.js";
import type { UserService } from "../users/user.service.js";
import type { ProductService } from "../products/product.service.js";
import type { OrderService } from "../orders/order.service.js";
import type { RateLimiter } from "../../middleware/rate-limit.js";

export class BotService {
  constructor(
    private whatsapp: IWhatsAppProvider,
    private conversation: ConversationService,
    private userService: UserService,
    private productService: ProductService,
    private orderService: OrderService,
    private rateLimiter: RateLimiter,
  ) {}

  async handleMessage(from: string, messageId: string, text: string): Promise<void> {
    const user = await this.userService.findOrCreate({ whatsappPhone: from });
    const state = await this.conversation.getOrDefault(from);

    const normalizedText = text.trim().toUpperCase();

    if (normalizedText === "MENU" || normalizedText === "INÍCIO" || normalizedText === "INICIO") {
      await this.sendMainMenu(from);
      await this.conversation.setState(from, "IDLE");
      return;
    }

    if (normalizedText === "CANCELAR") {
      await this.whatsapp.sendText(from, "❌ Ação cancelada. Digite MENU para ver as opções.");
      await this.conversation.setState(from, "IDLE");
      return;
    }

    if (state.state === "IDLE") {
      await this.handleIdleState(from, normalizedText);
      return;
    }

    if (state.state === "SELECTING_PRODUCT") {
      await this.handleProductSelection(from, normalizedText);
      return;
    }

    await this.whatsapp.sendText(
      from,
      "🤖 Desculpe, não entendi. Digite MENU para ver as opções.",
    );
  }

  private async sendMainMenu(to: string): Promise<void> {
    const menu = [
      "👋 Bem-vindo ao FotoZap IA!",
      "",
      "Escolha uma opção:",
      "1️⃣ Criar foto",
      "2️⃣ Ver produtos",
      "3️⃣ Ver preços",
      "4️⃣ Ajuda",
      "",
      "Digite o número da opção.",
    ].join("\n");

    await this.whatsapp.sendText(to, menu);
  }

  private async handleIdleState(from: string, text: string): Promise<void> {
    if (text === "1" || text.includes("CRIAR") || text.includes("FOTO")) {
      await this.showProducts(from);
      return;
    }

    if (text === "2" || text.includes("PRODUTO")) {
      await this.showProducts(from);
      return;
    }

    if (text === "3" || text.includes("PREÇO") || text.includes("PRECO")) {
      await this.showProducts(from);
      return;
    }

    if (text === "4" || text.includes("AJUDA")) {
      await this.sendHelp(from);
      return;
    }

    if (text === "OI" || text === "OLÁ" || text === "OLA" || text === "HI" || text === "HELLO") {
      await this.sendMainMenu(from);
      return;
    }

    await this.sendMainMenu(from);
  }

  private async showProducts(from: string): Promise<void> {
    const products = await this.productService.listActive();

    if (products.length === 0) {
      await this.whatsapp.sendText(
        from,
        "😔 Nenhum produto disponível no momento. Tente mais tarde.",
      );
      return;
    }

    const lines = ["🎨 Produtos disponíveis:", ""];

    products.forEach((product, index) => {
      const price = (product.priceCents / 100).toFixed(2).replace(".", ",");
      lines.push(`${index + 1}️⃣ ${product.name}`);
      lines.push(`   ${product.description}`);
      lines.push(`   💰 R$ ${price}`);
      lines.push("");
    });

    lines.push("Digite o número para escolher:");

    await this.whatsapp.sendText(from, lines.join("\n"));
    await this.conversation.setState(from, "SELECTING_PRODUCT");
  }

  private async handleProductSelection(from: string, text: string): Promise<void> {
    const products = await this.productService.listActive();
    const choice = parseInt(text, 10);

    if (isNaN(choice) || choice < 1 || choice > products.length) {
      await this.whatsapp.sendText(
        from,
        `❌ Opção inválida. Digite um número de 1 a ${products.length}.`,
      );
      return;
    }

    const product = products[choice - 1];

    if (!product) {
      await this.whatsapp.sendText(from, "❌ Produto não encontrado.");
      return;
    }

    // Rate limit check for order creation
    const orderLimit = await this.rateLimiter.checkOrders(from);
    if (!orderLimit.allowed) {
      const remainingTime = await this.rateLimiter.getRemainingTime(from, "orders");
      await this.whatsapp.sendText(
        from,
        `🛑 Limite de pedidos atingido. Você pode criar ${orderLimit.remaining} pedido(s) em ${Math.ceil(remainingTime / 60)} minuto(s).`,
      );
      return;
    }

    const user = await this.userService.findByPhone(from);
    if (!user) {
      await this.whatsapp.sendText(from, "❌ Erro: usuário não encontrado.");
      return;
    }

    const order = await this.orderService.create({
      userId: user.id,
      productId: product.id,
      amountCents: product.priceCents,
      currency: product.currency,
    });

    await this.whatsapp.sendText(
      from,
      [
        `✅ Você escolheu: ${product.name}`,
        "",
        "📸 Agora envie a sua foto.",
      ].join("\n"),
    );

    await this.conversation.setState(from, "WAITING_FOR_IMAGE", {
      productId: product.id,
      orderDraftId: order.id,
    });
  }

  private async sendHelp(from: string): Promise<void> {
    const help = [
      "ℹ️ Ajuda - FotoZap IA",
      "",
      "Como funciona:",
      "1. Escolha um produto",
      "2. Envie sua foto",
      "3. Faça o pagamento via Pix",
      "4. Receba sua imagem processada",
      "",
      "Comandos:",
      "• MENU - voltar ao menu",
      "• CANCELAR - cancelar operação",
      "• AJUDA - ver esta mensagem",
      "",
      "Digite MENU para começar.",
    ].join("\n");

    await this.whatsapp.sendText(from, help);
  }
}
