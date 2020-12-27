#include "IrDecoder.h"
#include "Arduino.h"

void IrDecoder::start(int pin)
{
  instance = this;
  attachInterrupt(digitalPinToInterrupt(pin), isr, FALLING);
}

IrDecoder *IrDecoder::instance;
void IrDecoder::isr()
{
  if (instance) instance->pulse();
}

unsigned long IrDecoder::getLastPulseLength()
{
  unsigned long now = micros();
  unsigned long pulseLength = now - this->lastPulseSeen;
  if (now < this->lastPulseSeen) {
    pulseLength = 0xFFFFFFFF - this->lastPulseSeen + now;
  }

  if (pulseLength > MIN_PULSE_LENGTH)
  {
    this->lastPulseSeen = now;
  }
  return pulseLength;
}

void IrDecoder::resetCurrentPacket()
{
  this->bitPosition = 0;
}

void IrDecoder::resetCurrentMessage()
{
  this->bitPosition = 0;
  this->state = IrDecoderState::normal;
}

void IrDecoder::shiftInBit(uint16_t data)
{
  if (this->state == IrDecoderState::normal)
  {
    this->normalPacket.data = (this->normalPacket.data >> 1) | data;
    if (++this->bitPosition == 15)
    {
      this->normalPacket.data >>= 1;
      this->state = IrDecoderState::inverted;
      this->bitPosition = 0;
    }
  }
  else if (this->state == IrDecoderState::inverted)
  {
    this->invertedPacket.data = (this->invertedPacket.data >> 1) | data;
    if (++this->bitPosition == 15)
    {
      this->invertedPacket.data >>= 1;
      this->state = IrDecoderState::normal;
      this->bitPosition = 0;
      
      this->decodeCurrentMessage();
    }
  }
}

void IrDecoder::decodeCurrentMessage()
{
  if (this->normalPacket.fields.address == this->invertedPacket.fields.address &&
      (this->normalPacket.fields.command ^ this->invertedPacket.fields.command) == 0xFF &&
      (this->normalPacket.fields.extra ^ this->invertedPacket.fields.extra) == 0x03)
  {
    if (!this->messageBuffer[this->messageWritePosition].isWritten)
    {
      this->messageBuffer[this->messageWritePosition].isWritten = true;
      this->messageBuffer[this->messageWritePosition].packet = this->normalPacket;

      this->messageWritePosition++;
      if (this->messageWritePosition == MESSAGE_BUFFER_LENGTH) this->messageWritePosition = 0;
    }
  }
}

void IrDecoder::pulse()
{
  unsigned long pulseLength = this->getLastPulseLength();
  this->lastPulseSeen = micros();

  if (pulseLength > MAX_PACKET_SPACE)
  {
    this->resetCurrentMessage();
    return;
  }
  if (pulseLength > MAX_PULSE_LENGTH)
  {
    this->resetCurrentPacket();
    return;
  }
  
  if (pulseLength > ZERO_ONE_THRESHOLD) this->shiftInBit(0x8000);
  else this->shiftInBit(0x0000);
}

bool IrDecoder::available()
{
  return this->messageBuffer[this->messageReadPosition].isWritten;
}

IrPacket IrDecoder::read()
{
  IrPacket packet = this->messageBuffer[this->messageReadPosition].packet;
  this->messageBuffer[this->messageReadPosition].isWritten = false;
  
  this->messageReadPosition++;
  if (this->messageReadPosition == MESSAGE_BUFFER_LENGTH) this->messageReadPosition = 0;
  
  return packet;
}
