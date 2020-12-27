#pragma once
#include "Arduino.h"

class IrEncoder {
  private:
    int pin;

    void sendSamsungPulse(int, unsigned int);
    void sendSamsungBit(int, byte);
    
  public:
    void start(int);
    void sendSamsung(byte, byte, byte);
};
