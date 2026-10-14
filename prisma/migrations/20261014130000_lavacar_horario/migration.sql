-- Lavacar: descrição ganha o horário (08h00 às 12h00 e 13h00 às 16h00), antes dos valores. Atualiza os
-- próximos Lavacar que estão com a descrição padrão, com ou sem os valores (os editados no painel e os
-- que já passaram não mudam).
UPDATE "events"
SET "description" = 'Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!

🕗 Horário: das 08h00 às 12h00 e das 13h00 às 16h00

💰 Valores:
🏍️ Motocicleta: R$ 25,00
🚘 Carro: R$ 50,00
🚙 Caminhonete: R$ 70,00
🚐 Van: R$ 90,00',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "title" = 'Lavacar'
  AND "event_date" >= CURRENT_TIMESTAMP
  AND "description" IN (
    'Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!',
    'Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!

💰 Valores:
🏍️ Motocicleta: R$ 25,00
🚘 Carro: R$ 50,00
🚙 Caminhonete: R$ 70,00
🚐 Van: R$ 90,00'
  );
