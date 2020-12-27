#pragma once
#include "Arduino.h"

class Samsung {
  public:
    void start(int);
    void sendCommand(byte[4]);
    bool isPoweredOn();
};
