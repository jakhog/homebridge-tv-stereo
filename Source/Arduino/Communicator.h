#pragma once
#include "Arduino.h"

#define MAX_DATA 100
#define BUFFER_SIZE 105

struct Message {
  byte type;
  byte id;
  byte length;
  byte data[MAX_DATA];
};

class Communicator {
  private:
    Message current;
    bool currentWritten;

    byte messageBuffer[BUFFER_SIZE];
    byte bufferPosition;
    
  public:
    void start(int);
    bool available();
    Message* read();
    void write(Message*);
};
