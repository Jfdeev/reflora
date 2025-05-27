# 🌿 Reflora

**Reflora** é uma API desenvolvida para receber, armazenar e fornecer dados de sensores ambientais que serão comercializados pela nossa startup. Esses dados serão consumidos por um aplicativo mobile desenvolvido em **React Native**, permitindo o monitoramento em tempo real das informações coletadas.

O objetivo principal do projeto é fornecer uma infraestrutura escalável e eficiente para a coleta e acesso remoto de dados da flora brasileira, promovendo a preservação ambiental e o uso sustentável dos recursos naturais.

## 🚀 Tecnologias Utilizadas

- **TypeScript** – Linguagem principal para desenvolvimento da API.
- **Node.js** – Ambiente de execução do back-end.
- **Express** – Framework web para criação de rotas e controle de requisições.
- **Drizzle ORM** – ORM moderno e leve para comunicação com o banco de dados.
- **PostgreSQL** – Banco de dados relacional para armazenamento dos dados dos sensores.

## 📱 Integração com Aplicativo

Os dados recebidos pela API serão consumidos por um **aplicativo em React Native**, que exibirá gráficos, alertas e visualizações sobre os sensores instalados em campo.

## 📂 Estrutura do Projeto

reflora/
├── src/ # Código-fonte principal  
│ ├── controllers/ # Lógica de controle das rotas  
│ ├── models/ # Definições dos modelos de dados (tabelas de sensores, leituras, etc.)  
│ ├── routes/ # Endpoints da API  
│ └── utils/ # Funções utilitárias  
├── dist/ # Arquivos compilados  
├── .env # Variáveis de ambiente  
├── drizzle.config.ts # Configurações do Drizzle ORM  
├── package.json # Dependências e scripts do projeto  
└── tsconfig.json # Configurações do TypeScript  
