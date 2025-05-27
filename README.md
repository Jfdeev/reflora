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
├── dist/                    # Arquivos compilados
│   ├── index.js
│   ├── index.d.ts
│   ├── index.d.mts
│   └── index.mjs
├── node_modules/
├── src/                     # Código-fonte principal
│   ├── db/                  # Configurações do Drizzle ORM
│   │   ├── db.ts            # Conexão e instância do drizzle
│   │   └── schema.ts        # Definição das tabelas
│   ├── middlewares/         # Middlewares personalizados
│   │   └── auth.ts          # Middleware de autenticação
│   ├── routes/              # Definição de rotas da API
│   │   ├── private.ts       # Rotas protegidas (autenticadas)
│   │   ├── public.ts        # Rotas públicas (login, cadastro, etc.)
│   │   └── index.ts         # Agrega e exporta as rotas
│   └── index.ts             # Entrada principal do servidor
├── .env                     # Variáveis de ambiente
├── .gitignore
├── drizzle.config.ts        # Configuração do Drizzle
├── package.json
├── package-lock.json
├── tsconfig.json            # Configurações do TypeScript
└── README.md

