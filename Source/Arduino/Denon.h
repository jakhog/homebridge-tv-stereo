#pragma once
#include "Arduino.h"

union IrPacket {
  struct {
    byte address: 5;
    byte command: 8;
    byte extra: 2;
    byte _: 1;
  } fields;
  uint16_t data;
};

class Denon {
  private:
    int dataPin;
    int powerPin;
    void sendBits(uint16_t);
    
  public:
    void start(int, int);
    void sendCommand(byte, byte);
    bool isPoweredOn();
};
