#include "Messages.h"

void msgReady(Message* res, byte id)
{
  res->type = 0x00;
  res->id = id;
  res->length = 5;
  memcpy(res->data,"READY",5);
}

void msgOK(Message* res, byte id)
{
  res->type = 0x00;
  res->id = id;
  res->length = 2;
  memcpy(res->data,"OK",2);
}

void msgError(Message* res, byte id)
{
  res->type = 0x00;
  res->id = id;
  res->length = 7;
  memcpy(res->data,"UNKNOWN",7);
}

void msgUnknown(Message* res, byte id)
{
  res->type = 0x00;
  res->id = id;
  res->length = 5;
  memcpy(res->data,"ERROR",5);
}
