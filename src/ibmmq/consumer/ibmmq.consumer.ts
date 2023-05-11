import { StringDecoder } from 'string_decoder';
import * as mq from 'ibmmq';
import { MQC } from 'ibmmq';
import { IConsumer } from './consumer.interface';
export class IbmmqConsumer implements IConsumer {
  private readonly qMgr;
  private qName;
  private readonly waitInterval;
  private msgId: string | null = null;
  private connectionHandle: mq.MQQueueManager;
  private queueHandle: mq.MQObject;
  private ok = true;
  private exitCode = 0;
  private readonly decoder: StringDecoder = new StringDecoder('utf8');
  private async delay(delayMs): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  constructor(qManager: string, qName: string, waitInterval: number) {
    this.qMgr = qManager;
    this.qName = qName;
    this.waitInterval = waitInterval;
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
  private hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }
  private getCB(
    err: mq.MQError | null,
    hObj: mq.MQObject,
    gmo: mq.MQGMO,
    md: mq.MQMD,
    buf: Buffer | null,
    hconn: mq.MQQueueManager,
  ): string {
    let message: string;
    if (err) {
      if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
      } else {
        console.log('MQ call failed in ' + err);
        this.exitCode = 1;
      }
      this.ok = false;
      mq.GetDone(hObj);
    } else {
      if (md!.Format == 'MQSTR') {
        message = this.decoder.write(buf!);
      } else {
        message = buf!.toString();
      }
    }
    return message;
  }
  private getArrayMessages(
    queueHandle: mq.MQObject,
    md: mq.MQMD,
    gmo: mq.MQGMO,
  ): Promise<string[]> {
    const messages: string[] = [];
    return new Promise(async (resolve, reject) => {
      mq.Get(queueHandle, md, gmo, (err, hObj, gmo, md, buf, hconn) => {
        const message = this.getCB(err, hObj, gmo, md, buf, hconn);
        messages.push(message);
      });
      await this.delay((this.waitInterval + 2) * 1000);
      resolve(messages);
    });
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
  async consume(): Promise<string[]> {
    try {
      const md = new mq.MQMD();
      const gmo = new mq.MQGMO();

      gmo.Options =
        MQC.MQGMO_NO_SYNCPOINT | MQC.MQGMO_WAIT | MQC.MQGMO_CONVERT | MQC.MQGMO_FAIL_IF_QUIESCING;
      gmo.MatchOptions = MQC.MQMO_NONE;
      gmo.WaitInterval = this.waitInterval * 1000; // 3 seconds

      if (this.msgId != null) {
        gmo.MatchOptions = MQC.MQMO_MATCH_MSG_ID;
        md.MsgId = Buffer.from(this.hexToBytes(this.msgId));
      }
      mq.setTuningParameters({ getLoopPollTimeMs: 500 });
      const messages: string[] = await this.getArrayMessages(this.queueHandle, md, gmo);
      return messages.filter((message: string) => message);
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
