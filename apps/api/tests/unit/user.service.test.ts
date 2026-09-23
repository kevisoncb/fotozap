import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserService } from "../../src/modules/users/user.service.js";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService(mockPrisma);
  });

  it("should create new user when phone not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user1",
      whatsappPhone: "+5511999999999",
      name: "João",
      status: "ACTIVE",
    });

    const user = await service.findOrCreate({
      whatsappPhone: "+5511999999999",
      name: "João",
    });

    expect(user.id).toBe("user1");
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          whatsappPhone: "+5511999999999",
          name: "João",
        }),
      }),
    );
  });

  it("should update lastInteractionAt for existing user", async () => {
    const existingUser = {
      id: "user1",
      whatsappPhone: "+5511999999999",
      status: "ACTIVE",
    };

    mockPrisma.user.findUnique.mockResolvedValue(existingUser);
    mockPrisma.user.update.mockResolvedValue(existingUser);

    await service.findOrCreate({ whatsappPhone: "+5511999999999" });

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user1" },
        data: expect.objectContaining({ lastInteractionAt: expect.any(Date) }),
      }),
    );
  });

  it("should mark user as deleted and clear name", async () => {
    mockPrisma.user.update.mockResolvedValue({});

    await service.markDeleted("user1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: {
        status: "DELETED",
        name: null,
      },
    });
  });
});
