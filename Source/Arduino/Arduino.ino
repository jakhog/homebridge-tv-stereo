#include "Communicator.h"
#include "Denon.h"
#include "Samsung.h"
#include "IrDecoder.h"
#include "IrEncoder.h"
#include "Messages.h"

Communicator communicator;
Denon denon;
Samsung samsung;
IrDecoder decoder;
IrEncoder encoder;

void setup() {
  communicator.start(115200);
  denon.start(8,9);
  samsung.start(9600);
  decoder.start(7);
  encoder.start(6);
}

void loop() {
  while (decoder.available())
  {
    IrPacket packet = decoder.read();
    if (packet.fields.address == 2 && (packet.fields.command == 241 || packet.fields.command == 242))
    {
      denon.sendCommand(packet.fields.address, packet.fields.command);
    }
  }
  
  if (communicator.available())
  {
    Message* req = communicator.read();
    Message res;
    msgError(&res, req->id);
    switch (req->type)
    {
      case 0x00:
        handleTextCommand(req, &res);
        break;
      case 0x01:
        handleDenonCommand(req, &res);
        break;
      case 0x02:
        handleDenonStatus(req, &res);
        break;
      case 0x04:
        handleSamsungCommand(req, &res);
        break;
      case 0x05:
        handleSamsungStatus(req, &res);
        break;
      default:
        msgUnknown(&res, req->id);
    }
    communicator.write(&res);
  }
}

/* --- TEXT --- */
void handleTextCommand(Message* req, Message* res)
{
  if (memcmp(req->data,"READY?",6) == 0)
  {
    msgReady(res, req->id);
    return;
  }
  msgUnknown(res, req->id);
}

/* --- DENON --- */
void handleDenonCommand(Message* req, Message* res)
{
  if (req->length != 2)
  {
    msgError(res, req->id);
    return;
  }
  else
  {
    denon.sendCommand(req->data[0], req->data[1]);
    msgOK(res, req->id);
    return;
  }
}

void handleDenonStatus(Message* req, Message* res)
{
  struct Message result { 0x03, 1 };
  result.data[0] = denon.isPoweredOn();
  communicator.write(&result);
  msgOK(res, req->id);
}

/* --- SAMSUNG --- */
void handleSamsungCommand(Message* req, Message* res)
{
  if (req->length != 4)
  {
    msgError(res, req->id);
  }
  else
  {
    byte data[4];
    memcpy(data, req->data, 4);
    if (data[0] == 0x00 && data[1] == 0x00 && data[2] == 0x00 && data[3] == 0x02)
    {
      decoder.stop(7);
      encoder.sendSamsung(7, 7, 153);
      delay(50);
      encoder.sendSamsung(7, 7, 153);
      delay(50);
      encoder.sendSamsung(7, 7, 153);
      decoder.start(7);
    }
    else
    {
      samsung.sendCommand(data);
    }
    msgOK(res, req->id);
  }
}

void handleSamsungStatus(Message* req, Message* res)
{
  struct Message result { 0x06, 1 };
  result.data[0] = samsung.isPoweredOn();
  communicator.write(&result);
  msgOK(res, req->id);
}
