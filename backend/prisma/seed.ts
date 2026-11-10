import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedItem = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  description: string;
  imageUrl: string | null;
  highlighted: boolean;
};

const seedItems: SeedItem[] = require('./legacy-items.json');

// Las 8 categorías legacy (la 1 = "Todas" es un pseudo-filtro del catálogo).
const categories = [
  { id: 1, name: 'Todas', description: 'Categoría que incluye todos los productos.' },
  { id: 2, name: 'Remeras', description: 'Remeras masculinas.' },
  { id: 3, name: 'Musculosas', description: 'Musculosas.' },
  { id: 4, name: 'Shorts', description: 'Short.' },
  { id: 5, name: 'Pantalones', description: 'Pantalones Masculinos.' },
  { id: 6, name: 'Buzos', description: 'Buzos.' },
  { id: 7, name: 'Camperas', description: 'Camperas.' },
  { id: 8, name: 'Camisetas', description: 'Camisetas masculinas.' },
];

const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'admin@admin.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
const adminName = process.env.ADMIN_NAME?.trim() || 'Administrador';

const users = [
  {
    email: adminEmail,
    password: adminPassword,
    role: Role.ADMIN,
    name: adminName,
  },
  {
    email: 'cliente@cliente.com',
    password: 'cliente',
    role: Role.CLIENT,
    name: 'Cliente Demo',
  },
];

const banners = [
  {
    title: 'Nueva temporada 2026',
    imageUrl: '1727733285968.png',
    linkUrl: '/productos?categoria=2',
    order: 0,
    isActive: true,
  },
  {
    title: 'Camperas para el frío',
    imageUrl: '1727735458110.png',
    linkUrl: '/productos?categoria=7',
    order: 1,
    isActive: true,
  },
  {
    title: 'Camisetas de fútbol',
    imageUrl: '1727735680688.png',
    linkUrl: '/productos?categoria=8',
    order: 2,
    isActive: true,
  },
];

// Imágenes secundarias de la galería según la categoría legacy.
const galleryByCategory: Record<number, string[]> = {
  2: ['categoria2.png', 'categoria2-2.png'],
  3: ['categoria3.png', 'categoria3 2.png'],
  4: ['categoria4.png', 'categoria4 2.png'],
  5: ['categoria5.png', 'categoria5 2.png'],
  6: ['categoria6.png', 'categoria6 2.png'],
  7: ['categoria7.png', 'categoria7 2.png'],
};

async function main() {
  // ── Categorías ──────────────────────────────────────────────
  for (const category of categories) {
    const id = String(category.id);
    await prisma.category.upsert({
      where: { id },
      update: { name: category.name, description: category.description },
      create: { id, name: category.name, description: category.description },
    });
  }
  console.log(`✔ ${categories.length} categorías sembradas`);

  // ── Usuarios de prueba ─────────────────────────────────────
  for (const user of users) {
    const password = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        name: user.name,
        isEmailVerified: true,
      },
      create: {
        email: user.email,
        password,
        name: user.name,
        role: user.role,
        isEmailVerified: true,
      },
    });
  }
  console.log(
    `✔ ${users.length} usuarios sembrados (admin: ${adminEmail})`,
  );

  // ── Productos legacy + galería + variantes + specs ─────────
  for (const item of seedItems) {
    const id = String(item.id);
    const data = {
      name: item.name,
      description: item.description || '',
      price: item.price,
      stock: 20,
      imageUrl: item.imageUrl,
      highlighted: item.highlighted,
      categoryId: String(item.categoryId),
      specs: {
        Material: 'Algodón',
        Género: 'Hombre',
        Temporada: '2024',
      },
    };

    await prisma.product.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });

    const imageCount = await prisma.productImage.count({
      where: { productId: id },
    });
    if (imageCount === 0) {
      const gallery = [
        item.imageUrl,
        ...(galleryByCategory[item.categoryId] ?? []),
      ].filter(Boolean) as string[];

      if (gallery.length > 0) {
        await prisma.productImage.createMany({
          data: gallery.map((url) => ({ url, productId: id })),
        });
      }
    }

    const variantCount = await prisma.productVariant.count({
      where: { productId: id },
    });
    if (variantCount === 0) {
      const variants = [
        ...['S', 'M', 'L', 'XL'].map((value) => ({
          name: 'Talle',
          value,
          stock: 5,
          productId: id,
        })),
        ...['Negro', 'Blanco'].map((value) => ({
          name: 'Color',
          value,
          stock: 10,
          productId: id,
        })),
      ];

      await prisma.productVariant.createMany({ data: variants });
    }

    // El stock total del producto es la suma de sus variantes.
    const currentVariants = await prisma.productVariant.findMany({
      where: { productId: id },
      select: { stock: true },
    });
    const totalStock = currentVariants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    );
    await prisma.product.update({
      where: { id },
      data: { stock: totalStock },
    });
  }
  console.log(`✔ ${seedItems.length} productos sembrados (con galería y variantes)`);

  // ── Reseña y pregunta de ejemplo ───────────────────────────
  const demoProductId = String(seedItems[0]?.id ?? '72');
  const demoUser = await prisma.user.findUnique({
    where: { email: 'cliente@cliente.com' },
  });
  if (demoUser) {
    await prisma.productReview.upsert({
      where: {
        productId_userId: { productId: demoProductId, userId: demoUser.id },
      },
      update: {},
      create: {
        productId: demoProductId,
        userId: demoUser.id,
        rating: 5,
        comment: 'Muy buena calidad y calce perfecto. Recomendable.',
      },
    });

    const existingQuestion = await prisma.productQuestion.findFirst({
      where: { productId: demoProductId, userId: demoUser.id },
    });
    if (!existingQuestion) {
      await prisma.productQuestion.create({
        data: {
          productId: demoProductId,
          userId: demoUser.id,
          question: '¿Hacen envíos a todo el país?',
          answer: 'Sí, enviamos a todo el país con seguimiento.',
          answeredAt: new Date(),
        },
      });
    }
    console.log('✔ Reseña y pregunta de ejemplo sembradas');
  }

  // ── Banners de la Home ─────────────────────────────────────
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({ data: banners });
    console.log(`✔ ${banners.length} banners sembrados`);
  } else {
    console.log(`↺ ${bannerCount} banners ya existentes, no se modifican`);
  }
}

main()
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
