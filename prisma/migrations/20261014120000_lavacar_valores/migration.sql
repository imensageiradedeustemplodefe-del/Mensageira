-- Lavacar: descrição passa a trazer os valores. Atualiza só os próximos Lavacar que ainda estão com a
-- descrição padrão (os que a equipe editou no painel ficam como estão; os antigos não mudam).
UPDATE "events"
SET "description" = 'Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!

💰 Valores:
🏍️ Motocicleta: R$ 25,00
🚘 Carro: R$ 50,00
🚙 Caminhonete: R$ 70,00
🚐 Van: R$ 90,00',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "title" = 'Lavacar'
  AND "description" = 'Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!'
  AND "event_date" >= CURRENT_TIMESTAMP;
