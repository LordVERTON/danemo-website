-- Seed data for containers table
-- This script inserts sample container data for testing and development

-- Insert sample containers with various statuses and destinations
INSERT INTO containers (code, vessel, departure_port, arrival_port, etd, eta, status, client_id) VALUES
-- Containers en transit
('MSKU1234567', 'MSC OSCAR', 'Port d''Anvers, Belgique', 'Port de Douala, Cameroun', 
 NOW() + INTERVAL '5 days', NOW() + INTERVAL '25 days', 'planned', NULL),

('TCLU9876543', 'CMA CGM MARCO POLO', 'Port de Rotterdam, Pays-Bas', 'Port de Lagos, Nigeria', 
 NOW() + INTERVAL '3 days', NOW() + INTERVAL '22 days', 'planned', NULL),

('GESU4567890', 'EVERGREEN EVER ACE', 'Port du Havre, France', 'Port d''Abidjan, Côte d''Ivoire', 
 NOW() + INTERVAL '7 days', NOW() + INTERVAL '28 days', 'planned', NULL),

-- Containers en transit
('APLU2345678', 'COSCO SHIPPING UNIVERSE', 'Port d''Hambourg, Allemagne', 'Port de Tema, Ghana', 
 NOW() - INTERVAL '2 days', NOW() + INTERVAL '18 days', 'in_transit', NULL),

('OOCU3456789', 'OOCL HONG KONG', 'Port de Felixstowe, Royaume-Uni', 'Port de Dakar, Sénégal', 
 NOW() - INTERVAL '5 days', NOW() + INTERVAL '20 days', 'in_transit', NULL),

-- Containers arrivés
('HLCU5678901', 'HAPAG-LLOYD BERLIN', 'Port de Bremerhaven, Allemagne', 'Port de Lomé, Togo', 
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days', 'arrived', NULL),

('ONEU6789012', 'ONE INNOVATION', 'Port de Gênes, Italie', 'Port de Cotonou, Bénin', 
 NOW() - INTERVAL '28 days', NOW() - INTERVAL '1 day', 'arrived', NULL),

-- Containers livrés
('YMLU7890123', 'YANG MING UNANIMITY', 'Port de Barcelone, Espagne', 'Port de Pointe-Noire, Congo', 
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 'delivered', NULL),

('PILU8901234', 'PACIFIC INTERNATIONAL LINES', 'Port de Marseille, France', 'Port de Dar es Salaam, Tanzanie', 
 NOW() - INTERVAL '50 days', NOW() - INTERVAL '20 days', 'delivered', NULL),

-- Containers avec statut retardé
('ZIMU9012345', 'ZIM CONSTANZA', 'Port d''Algésiras, Espagne', 'Port de Mombasa, Kenya', 
 NOW() - INTERVAL '10 days', NOW() + INTERVAL '5 days', 'delayed', NULL),

('MSCU0123456', 'MSC GÜLSÜN', 'Port de Valence, Espagne', 'Port de Luanda, Angola', 
 NOW() - INTERVAL '8 days', NOW() + INTERVAL '7 days', 'delayed', NULL),

-- Containers partis récemment
('CMAU1234567', 'CMA CGM ANTOINE DE SAINT EXUPERY', 'Port de Zeebrugge, Belgique', 'Port de Durban, Afrique du Sud', 
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '24 days', 'departed', NULL),

('EVERU2345678', 'EVERGREEN EVER GIVEN', 'Port de Southampton, Royaume-Uni', 'Port de Maputo, Mozambique', 
 NOW() - INTERVAL '3 days', NOW() + INTERVAL '22 days', 'departed', NULL),

-- Containers supplémentaires pour plus de variété
('COSU3456789', 'COSCO SHIPPING TAURUS', 'Port de Le Havre, France', 'Port de Casablanca, Maroc', 
 NOW() + INTERVAL '10 days', NOW() + INTERVAL '15 days', 'planned', NULL),

('HAPU4567890', 'HAPAG-LLOYD MUNICH', 'Port d''Amsterdam, Pays-Bas', 'Port de Tanger, Maroc', 
 NOW() + INTERVAL '12 days', NOW() + INTERVAL '18 days', 'planned', NULL),

('MAEU5678901', 'MAERSK EDISON', 'Port de Dunkerque, France', 'Port de Nouakchott, Mauritanie', 
 NOW() - INTERVAL '15 days', NOW() + INTERVAL '10 days', 'in_transit', NULL),

('NYKU6789012', 'NYK VENUS', 'Port de Lisbonne, Portugal', 'Port de Conakry, Guinée', 
 NOW() - INTERVAL '20 days', NOW() + INTERVAL '5 days', 'in_transit', NULL),

('KLEU7890123', 'K LINE SINGAPORE', 'Port de Barcelone, Espagne', 'Port de Freetown, Sierra Leone', 
 NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', 'arrived', NULL),

('HMMU8901234', 'HMM ALGECIRAS', 'Port de Gioia Tauro, Italie', 'Port de Monrovia, Liberia', 
 NOW() - INTERVAL '40 days', NOW() - INTERVAL '10 days', 'arrived', NULL)

ON CONFLICT (code) DO NOTHING;

-- Afficher un message de confirmation
DO $$
DECLARE
    container_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO container_count FROM containers;
    RAISE NOTICE 'Seed completed: % containers inserted/available in the database', container_count;
END $$;

