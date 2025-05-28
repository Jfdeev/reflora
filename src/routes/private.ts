import { and, eq, isNull } from 'drizzle-orm';
import express, { Request, Response } from 'express';
import { db } from '../db/db';
import {
  alertTable,
  sensorDataTable,
  sensorTable,
  userTable
} from '../db/schema';
import auth from '../middlewares/auth';

const router = express.Router();

// Mensagens de erro reutilizáveis
const ERROR_SERVER = 'Erro no Servidor, tente novamente';
const ERROR_NOT_FOUND = 'Não encontrado';
const ERROR_MISSING_FIELDS = 'Campos obrigatórios estão faltando';
const ERROR_INVALID_SENSOR = 'Sensor não encontrado';
const ERROR_INVALID_DATA = 'Dado não encontrado';

interface AuthenticatedRequest extends Request {
  userId?: number;
}

type Metric = 'soilHumidity' | 'temperature' | 'condutivity' | 'ph' | 'nitrogen' | 'phosphorus' | 'potassium';

const thresholds: Record<Metric, { ideal: [number, number]; intermediate: [number, number][] }> = {
  soilHumidity: { ideal: [20, 60], intermediate: [[15, 20], [60, 65]] },
  temperature:  { ideal: [18, 30], intermediate: [[15, 18], [30, 33]] },
  condutivity:  { ideal: [0.2, 2.0], intermediate: [[0.15, 0.2], [2.0, 2.5]] },
  ph:           { ideal: [6.0, 7.0], intermediate: [[5.5, 6.0], [7.0, 7.5]] },
  nitrogen:     { ideal: [20, 50], intermediate: [[15, 20], [50, 60]] },
  phosphorus:   { ideal: [15, 40], intermediate: [[10, 15], [40, 50]] },
  potassium:    { ideal: [100, 300], intermediate: [[80, 100], [300, 350]] },
};

// Função para tratar erros
const handleError = (res: Response, message: string, statusCode = 500) => {
  console.error(message);
  return res.status(statusCode).json({ message });
};

// Cadastrar sensor
router.post('/sensors', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { sensorName, location } = req.body;
    const userId = req.userId;
    if (!userId || !sensorName || !location) {
      return res.status(400).json({ message: ERROR_MISSING_FIELDS });
    }
    await db
      .insert(sensorTable)
      .values({ userId, sensorName, location, installationDate: new Date() })
      .execute();

    return res.status(201).json({ message: 'Sensor cadastrado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Atualizar informações do usuário
router.put('/user', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const { name, email } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({ message: ERROR_MISSING_FIELDS });
    }

    await db
      .update(userTable)
      .set({ name, email })
      .where(eq(userTable.userId, userId))
      .execute();

    return res.status(200).json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Deletar usuário
router.delete('/user', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'userId não encontrado' });
    }

    await db
      .delete(userTable)
      .where(eq(userTable.userId, userId))
      .execute();

    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Conectar sensor a um usuário
router.patch('/sensors/:sensorId/assign', async (req:AuthenticatedRequest, res:Response): Promise<any> => {
  try {
    const {sensorId} = req.params;
    const userId = req.userId!;
  
    if(!userId){
      return res.status(400).json({message: 'userId não encontrado'})
    }
  
    if(isNaN(Number(sensorId))){
      return res.status(400).json({message: 'sensorId inválido'})
    }
  
    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, Number(sensorId)), isNull(sensorTable.userId)))
      .execute();
  
    if(!sensor){
      return res.status(404).json({message: 'Sensor não encontrado ou já atribuído a um usuário'})
    }
  
    await db
      .update(sensorTable)
      .set({userId})
      .where(eq(sensorTable.sensorId, Number(sensorId)));
  
    return res.status(200).json({message: 'Sensor atribuído ao usuário com sucesso'});
  } catch (error) {
    console.error(error);
    return handleError(res, ERROR_SERVER);
  }
});

// Listar sensores do usuário
router.get('/sensors', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId!;
    const userSensors = await db
      .select()
      .from(sensorTable)
      .where(eq(sensorTable.userId, userId))
      .execute();

    if (userSensors.length === 0) {
      return res.status(404).json({ message: ERROR_NOT_FOUND });
    }

    return res.status(200).json(userSensors);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Buscar sensor específico
router.get('/sensors/:sensorId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;
    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }
    return res.status(200).json(sensor);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Atualizar sensor
router.put('/sensors/:sensorId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;
    const { sensorName, location } = req.body;

    if (!sensorName || !location) {
      return res.status(400).json({ message: 'sensorName e location são obrigatórios' });
    }

    const result = await db
      .update(sensorTable)
      .set({ sensorName, location })
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    return res.status(200).json({ message: 'Sensor atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    return handleError(res, ERROR_SERVER);
  }
});

// Deletar sensor
router.delete('/sensors/:sensorId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;

    const result = await db
      .delete(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    return res.status(200).json({ message: 'Sensor deletado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Inserir dados em um sensor e lancar alerta se nessesário 
router.post(
  '/sensors/:sensorId/data',
  auth,  // autenticação JWT
  async (req: Request, res: Response): Promise<any> => {
    try {
      const sensorId = Number(req.params.sensorId);
      const userId = req.userId!;
      const { soilHumidity, temperature, condutivity, ph, nitrogen, phosphorus, potassium } = req.body;

      // Validação dos campos obrigatórios: checar null ou undefined
      if (
        soilHumidity == null ||
        temperature  == null ||
        condutivity  == null ||
        ph           == null ||
        nitrogen     == null ||
        phosphorus   == null ||
        potassium    == null
      ) {
        return res.status(400).json({ message: ERROR_MISSING_FIELDS });
      }

      // Verificar se o sensor existe e pertence ao usuário
      const [sensor] = await db
        .select()
        .from(sensorTable)
        .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
        .execute();
      if (!sensor) {
        return res.status(404).json({ message: ERROR_INVALID_SENSOR });
      }

      // Inserir dados do sensor
      await db
        .insert(sensorDataTable)
        .values({ sensorId, soilHumidity, temperature, condutivity, ph, nitrogen, phosphorus, potassium, dateTime: new Date() })
        .execute();

      // Gerar alertas conforme thresholds
      const metrics: Record<Metric, number> = { soilHumidity, temperature, condutivity, ph, nitrogen, phosphorus, potassium };
      const generatedAlerts: Array<{ metric: Metric; level: string; message: string }> = [];

      for (const metric of Object.keys(metrics) as Metric[]) {
        const value = metrics[metric];
        const { ideal, intermediate } = thresholds[metric];
        let level: string;

        if (value >= ideal[0] && value <= ideal[1]) {
          continue; // OK
        } else if (intermediate.some(([min, max]) => value >= min && value <= max)) {
          level = 'Alerta';
        } else {
          level = 'Crítico';
        }

        const message = `${metric} fora do intervalo ideal (${value})`;
        // Salvar alerta no DB
        await db.insert(alertTable).values({ sensorId, message, level, timestamp: new Date() }).execute();
        generatedAlerts.push({ metric, level, message });
      }

      return res.status(201).json({
        message: 'Dados inseridos e alertas gerados',
        alerts: generatedAlerts,
      });
    } catch (error) {
      console.log(error);
      return handleError(res, ERROR_SERVER);
    }
  }
);

// Listar todos os dados de um sensor
router.get('/sensors/:sensorId/data', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    const data = await db
      .select()
      .from(sensorDataTable)
      .where(eq(sensorDataTable.sensorId, sensorId))
      .execute();

    if (data.length === 0) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return handleError(res, ERROR_SERVER);
  }
});

// Buscar dado específico de um sensor
router.get('/sensors/:sensorId/data/:dataId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const dataId = Number(req.params.dataId);
    const userId = req.userId!;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    const [datum] = await db
      .select()
      .from(sensorDataTable)
      .where(and(eq(sensorDataTable.sensorDataId, dataId), eq(sensorDataTable.sensorId, sensorId)))
      .execute();

    if (!datum) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json(datum);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Atualizar dado específico
router.put('/sensors/:sensorId/data/:dataId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const dataId = Number(req.params.dataId);
    const userId = req.userId!;
    const { soilHumidity, temperature, condutivity, ph, nitrogen, phosphorus, potassium } = req.body;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    const result = await db
      .update(sensorDataTable)
      .set({ soilHumidity, temperature, condutivity, ph, nitrogen, phosphorus, potassium })
      .where(and(eq(sensorDataTable.sensorDataId, dataId), eq(sensorDataTable.sensorId, sensorId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json({ message: 'Dado do sensor atualizado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Deletar dado específico
router.delete('/sensors/:sensorId/data/:dataId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const dataId = Number(req.params.dataId);
    const userId = req.userId!;

    const result = await db
      .delete(sensorDataTable)
      .where(and(eq(sensorDataTable.sensorDataId, dataId), eq(sensorDataTable.sensorId, sensorId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json({ message: 'Dado do sensor deletado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});
// Cadastrar alerta em um sensorId
router.post('/sensors/:sensorId/alert', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;
    const { message, level } = req.body;

    // Validação dos campos obrigatórios
    if (!message || !level) {
      return res.status(400).json({ message: ERROR_MISSING_FIELDS });
    }

    // Validação do sensorId
    if (isNaN(sensorId)) {
      return res.status(400).json({ message: 'sensorId inválido' });
    }

    // Verificar se o sensor pertence ao usuário
    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    // Inserir alerta
    await db
      .insert(alertTable)
      .values({
        sensorId,
        message,
        level,
        timestamp: new Date()
      })
      .execute();

    return res.status(201).json({ message: 'Alerta cadastrado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

//Listar todos os Alertas de um sensor
router.get('/sensor/:sensorId/alerts', async (req: AuthenticatedRequest,res: Response): Promise<any> =>{

  try{
    const { sensorId } = req.params
  const userId = req.userId!

  const sensorIdNumber = Number(sensorId)
  if(isNaN(sensorIdNumber)){
    return res.status(400).json({message: 'sensorId invalido'})
  }
  const [sensor] = await db
  .select()
  .from(sensorTable)
  .where(and(eq(sensorTable.sensorId, sensorIdNumber), eq(sensorTable.userId, userId)))
  .execute();

  if (!sensor) {
    return res.status(404).json({ message: ERROR_INVALID_SENSOR });
  }
  const alert = await db
  .select()
  .from(alertTable)
  .where(eq(alertTable.sensorId,sensorIdNumber))
  .execute()

  if(alert.length === 0){
    return res.status(404).json({message : 'Nenhum alerta encontrado para este sensor'})
  }
  return res.status(200).json(alert)
  }catch(error){
    return handleError(res,ERROR_SERVER)
  }
})
// buscar um alerta especifico
router.get('/sensors/:sensorId/alerts/:alertId', async (req: AuthenticatedRequest,res: Response): Promise<any> =>{
  try{
    const { sensorId,alertId } = req.params
    const userId = req.userId!

    const sensorIdNumber = Number(sensorId)
    const alertIdNumber = Number(alertId)

    if(isNaN(sensorIdNumber)|| isNaN(alertIdNumber)){
      return res.status(400).json({message : 'sensorId ou alertId invalido'})
    }
    const [sensor] = await db
    .select()
    .from(sensorTable)
    .where(and(eq(sensorTable.sensorId, sensorIdNumber), eq(sensorTable.userId, userId)))
    .execute();
    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }
    const [alert] = await db
    .select()
    .from(alertTable)
    .where(and(eq(alertTable.alertId, alertIdNumber), eq(alertTable.sensorId, sensorIdNumber)))
    .execute();

    if(!alert){
      return res.status(404).json({message: 'alerta nao encontrado para este sensor'})
    }
    return res.status(200).json(alert)
  }catch(error){
    return handleError(res,ERROR_SERVER)
  }
})
//Atualizar um alerta
router.put('/alert/:alertId', async (req:AuthenticatedRequest,res: Response) : Promise<any> =>{
  try{
    const { alertId } = req.params
    const userId = req.userId!
    const { message,level } = req.body

    const alertIdNumber = Number(alertId)
    if(isNaN(alertIdNumber)){
      return res.status(400).json({message : 'alertId invalido'})
    }
    
    if(!message || !level){
      return res.status(400).json({message : ERROR_MISSING_FIELDS})
    }

    const [alert] = await db
    .select()
    .from(alertTable)
    .innerJoin(sensorTable, eq(alertTable.sensorId, sensorTable.sensorId))
    .where(and(eq(alertTable.alertId, alertIdNumber), eq(sensorTable.userId, userId)))
    .execute();

  if (!alert) {
    return res.status(404).json({ message: 'Alerta não encontrado ou não pertence ao usuário' });
  }

  const result = await db
  .update(alertTable)
  .set({message,level})
  .where(eq(alertTable.alertId,alertIdNumber))
  .execute()

  if(result.rowCount ===0){
    return res.status(404).json({message :'Falha ao atualizar o alerta'})
  }

  return res.status(200).json({message: 'Alerta atualizado com sucesso'})
  }catch(error){
    return handleError(res,ERROR_SERVER)
  }
})
// deletar um alerta especifico
router.delete('/alert/:alertId', async (req: AuthenticatedRequest,res: Response): Promise<any> =>{
  try{
    const { alertId } = req.params
    const userId = req.userId!

    const alertIdNumber = Number(alertId)
    if(isNaN(alertIdNumber)){
      return res.status(400).json({message : 'alertId invalido'})
    }

    const [alert] = await db
    .select()
    .from(alertTable)
    .innerJoin(sensorTable,eq(alertTable.sensorId,sensorTable.sensorId))
    .where(and(eq(alertTable.alertId,alertIdNumber),eq(sensorTable.userId,userId)))
    .execute()

    if(!alert){
      return res.status(404).json({message : 'Alerta nao encontrado ou nao pertence ao usuario'})
    }

    const result = await db
      .delete(alertTable)
      .where(eq(alertTable.alertId, alertIdNumber))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Falha ao deletar o alerta' });
    }

    return res.status(200).json({message : 'Alerta deletado'})
  }catch(error){
    return handleError(res,ERROR_SERVER)
  }
})
export default router;