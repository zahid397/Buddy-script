import { seedDemoPersonas } from '../src/lib/demo/seed-personas';

seedDemoPersonas()
  .then(({ personaCount }) => {
    console.log(`Seeded ${personaCount} demo personas.`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
