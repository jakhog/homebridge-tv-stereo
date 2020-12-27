#include "Communicator.h"
#include "Arduino.h"

void Communicator::start(int baudRate)
{
  Serial.begin(baudRate);
}

bool Communicator::available()
{
  if (this->currentWritten) return true;

  while (Serial.available() > 0)
  {
    int data = Serial.read();

    // Wait for STX
    if (this->bufferPosition == 0 && data != 0x02) continue;

    // Read rest of data
    this->messageBuffer[this->bufferPosition] = data;
    this->bufferPosition++;

    // Discard data on buffer overflow
    if (this->bufferPosition == BUFFER_SIZE)
    {
      this->bufferPosition = 0;
      continue;
    }

    // Wait until a full message is received
    if (this->bufferPosition > 4 && this->bufferPosition == this->messageBuffer[3]+5)
    {
      this->current.type = this->messageBuffer[1];
      this->current.id = this->messageBuffer[2];
      this->current.length = this->messageBuffer[3];

      // Discard overflow messages
      if (this->current.length > MAX_DATA)
      {
        this->bufferPosition = 0;
        continue;
      }

      // Copy the data and calculate checksum
      byte calculatedChecksum = this->current.type ^ this->current.id ^ this->current.length;
      for (int i = 0; i < this->current.length; i++)
      {
        this->current.data[i] = this->messageBuffer[4+i];
        calculatedChecksum ^= this->current.data[i];
      }

      // Discard corrupt messages
      if (calculatedChecksum != this->messageBuffer[this->current.length+4])
      {
        this->bufferPosition = 0;
        continue;
      }

      // A message was read
      this->bufferPosition = 0;
      return true;
    }
  }

  return false;
}

Message* Communicator::read()
{
  return &this->current;
}

void Communicator::write(Message* msg)
{
  Serial.write(0x02);
  Serial.write(msg->type);
  Serial.write(msg->id);
  byte length = msg->length < MAX_DATA ? msg->length : MAX_DATA;
  byte checksum = msg->type ^ msg->id ^ length;
  Serial.write(length);
  for (int i = 0; i < length; ++i)
  {
    Serial.write(msg->data[i]);
    checksum ^= msg->data[i];
  }
  Serial.write(checksum);
}
