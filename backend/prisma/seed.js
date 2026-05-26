const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@unisabana.edu.co' },
    update: {},
    create: {
      email: 'admin@unisabana.edu.co',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  // Seller user
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@unisabana.edu.co' },
    update: {},
    create: {
      email: 'vendedor@unisabana.edu.co',
      password: sellerPassword,
      name: 'Juan Pérez',
      career: 'Ingeniería Informática',
      role: 'SELLER',
    },
  });

  // Buyer user
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  const buyer = await prisma.user.upsert({
    where: { email: 'comprador@unisabana.edu.co' },
    update: {},
    create: {
      email: 'comprador@unisabana.edu.co',
      password: buyerPassword,
      name: 'María García',
      career: 'Administración de Empresas',
      role: 'BUYER',
    },
  });

  // Sample products
  const categories = ['Libros', 'Electrónica', 'Ropa', 'Deportes', 'Hogar', 'Otros'];
  const products = [
    {
      title: 'Cálculo Diferencial - Stewart 8va Edición',
      description: 'Libro en excelente estado, pocas marcas a lápiz. Ideal para cálculo I y II.',
      price: 45000,
      category: 'Libros',
      condition: 'USED',
      images: ['https://picsum.photos/seed/libro1/400/300'],
    },
    {
      title: 'Audífonos Sony WH-1000XM4',
      description: 'Audífonos con cancelación de ruido, perfectos para estudiar. Incluye estuche.',
      price: 380000,
      category: 'Electrónica',
      condition: 'USED',
      images: ['https://picsum.photos/seed/audio1/400/300'],
    },
    {
      title: 'Calculadora Científica Casio FX-991',
      description: 'Calculadora nueva, sin uso. La compré de más.',
      price: 65000,
      category: 'Electrónica',
      condition: 'NEW',
      images: ['https://picsum.photos/seed/calc1/400/300'],
    },
    {
      title: 'Chaqueta Universitaria UniSabana L',
      description: 'Chaqueta oficial de la universidad talla L. Poco uso.',
      price: 90000,
      category: 'Ropa',
      condition: 'USED',
      images: ['https://picsum.photos/seed/ropa1/400/300'],
    },
    {
      title: 'Introducción a la Administración - Chiavenato',
      description: 'Libro base para administración. Muy buen estado.',
      price: 35000,
      category: 'Libros',
      condition: 'USED',
      images: ['https://picsum.photos/seed/libro2/400/300'],
    },
    {
      title: 'Mouse Inalámbrico Logitech MX Master',
      description: 'Mouse ergonómico, batería dura semanas. Perfecto para largas sesiones.',
      price: 120000,
      category: 'Electrónica',
      condition: 'USED',
      images: ['https://picsum.photos/seed/mouse1/400/300'],
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        sellerId: seller.id,
      },
    });
  }

  console.log('✅ Seed completado!');
  console.log('');
  console.log('👤 Usuarios de prueba:');
  console.log('   Admin:    admin@unisabana.edu.co / admin123');
  console.log('   Vendedor: vendedor@unisabana.edu.co / seller123');
  console.log('   Comprador: comprador@unisabana.edu.co / buyer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
