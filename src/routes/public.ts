import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { userTable } from '../db/schema';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const ERROR_SERVER = "Erro no Servidor, tente novamente";
const ERROR_USER_NOT_FOUND = "Usuário não encontrado";
const ERROR_INVALID_CREDENTIALS = "Senha incorreta";
const ERROR_REQUIRED_FIELDS = "Email e senha são obrigatórios";
const ERROR_MISSING_FIELDS = "Campos obrigatórios estão faltando";

// Função para tratamento de erros
const handleError = (res: Response, message: string, statusCode = 500) => {
  console.error(message);
  return res.status(statusCode).json({ message });
};

// Cadastro de usuário
router.post('/register', async (req: Request, res: Response):Promise<any> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: ERROR_MISSING_FIELDS });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const userDb = await db.insert(userTable).values({
      name,
      email,
      password: hashPassword,
    }).returning().execute();

const user = userDb[0];

const token = jwt.sign({ id: user.userId }, JWT_SECRET!, { expiresIn: '1h' });

res.status(201).json({
  token,
  name: user.name,
  email: user.email,
});
  } catch (error) {
    handleError(res, ERROR_SERVER);
  }
});

// Login de usuário
router.post('/login', async (req: Request, res: Response) : Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: ERROR_REQUIRED_FIELDS });
    }

    const selectedUser = await db.select().from(userTable).where(eq(userTable.email, email)).execute();

    if (selectedUser.length === 0) {
      return res.status(404).json({ message: ERROR_USER_NOT_FOUND });
    }

    const isMatch = await bcrypt.compare(password, selectedUser[0].password!);

    if (!isMatch) {
      return res.status(401).json({ message: ERROR_INVALID_CREDENTIALS });
    }

    const user = selectedUser[0];
    const token = jwt.sign({ id: user.userId }, JWT_SECRET!, { expiresIn: '1h' });

    res.status(200).json({
      token,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    handleError(res, ERROR_SERVER);
  }
});

export default router;
