#pragma once
#include "Denon.h"

#define MIN_PULSE_LENGTH 500
#define ZERO_ONE_THRESHOLD 1500
#define MAX_PULSE_LENGTH 2500
#define MAX_PACKET_SPACE 60000

#define MESSAGE_BUFFER_LENGTH 100

enum IrDecoderState { normal = 0, inverted = 1 };

struct IrDecoderMessage {
  IrPacket packet;
  bool isWritten;
};

class IrDecoder {
  private:
    static void isr();
    static IrDecoder *instance;

    unsigned long lastPulseSeen;
    unsigned long getLastPulseLength();
    
    byte bitPosition;
    IrDecoderState state;
    IrPacket normalPacket;
    IrPacket invertedPacket;
    void resetCurrentPacket();
    void resetCurrentMessage();
    void shiftInBit(uint16_t);

    void decodeCurrentMessage();
    
    void pulse();

    byte messageWritePosition;
    byte messageReadPosition;
    IrDecoderMessage messageBuffer[MESSAGE_BUFFER_LENGTH];
    
  public:
    void start(int);
    void stop(int);
    bool available();
    IrPacket read();
};
