import { StringDecoder } from 'string_decoder';
import * as mq from 'ibmmq';
import { MQC } from 'ibmmq';
import { IProducer } from './producer.interface';
export class IbmmqProducer implements IProducer {
  private readonly qMgr;
  private qName;
  private msgId: string | null = null;
  private connectionHandle: mq.MQQueueManager;
  private queueHandle: mq.MQObject;
  private ok = true;
  private exitCode = 0;

  constructor(qManager: string, qName: string) {
    this.qMgr = qManager;
    this.qName = qName;
  }
  private async cleanup(hConn: mq.MQQueueManager, hObj: mq.MQObject): Promise<void> {
    try {
      await mq.ClosePromise(hObj, 0);
      console.log('MQCLOSE successful');
      await mq.DiscPromise(hConn);
      console.log('MQDISC successful');
    } catch (closeErr) {
      console.log('MQ call failed in ' + closeErr);
    }
  }
  async produce(message: any): Promise<void> {
    const msg = `${message} ${new Date().toString()}`;
    const mqmd = new mq.MQMD();
    const pmo = new mq.MQPMO();
    pmo.Options = MQC.MQPMO_NO_SYNCPOINT | MQC.MQPMO_NEW_MSG_ID | MQC.MQPMO_NEW_CORREL_ID;
    return mq.PutPromise(this.queueHandle, mqmd, pmo, msg);
  }
  async connect(): Promise<void> {
    const myArgs = process.argv.slice(2); // Remove redundant parms
    if (myArgs[0]) {
      this.qName = myArgs[0];
    }
    if (myArgs[1]) {
      this.msgId = myArgs[1];
    }

    console.log('Connecting to queue manager', this.qMgr, 'and opening queue', this.qName);
    const cno = new mq.MQCNO();
    const csp = new mq.MQCSP();
    const cd = new mq.MQCD();
    csp.UserId = 'admin';
    csp.Password = 'passw0rd';
    cno.SecurityParms = csp;
    cno.ApplName = 'prueba';
    cd.ConnectionName = 'localhost(1414)';
    cd.ChannelName = 'DEV.ADMIN.SVRCONN';
    cno.ClientConn = cd;
    cno.Options = MQC.MQCNO_NONE;
    try {
      const conn = await mq.ConnxPromise(this.qMgr, cno);
      const od = new mq.MQOD();
      od.ObjectName = this.qName;
      od.ObjectType = MQC.MQOT_Q;
      const openOptions = MQC.MQOO_INPUT_AS_Q_DEF + MQC.MQOO_FAIL_IF_QUIESCING + MQC.MQOO_OUTPUT;
      this.connectionHandle = conn;
      console.log('MQCONN to', this.qMgr, 'successful');
      const obj = await mq.OpenPromise(this.connectionHandle, od, openOptions);
      console.log('MQOPEN of', this.qName, 'successful');
      this.queueHandle = obj;
    } catch (err) {
      this.ok = false;
      this.exitCode = 1;
      return;
    }
  }
  async disconnect(): Promise<void> {
    if (this.ok) {
      console.log('Disconnecting from queue manager', this.qMgr);
      await this.cleanup(this.connectionHandle, this.queueHandle);
    }
  }
}
