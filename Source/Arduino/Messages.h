#pragma once
#include "Communicator.h"

void msgReady(Message*, byte);
void msgOK(Message*, byte);
void msgError(Message*, byte);
void msgUnknown(Message*, byte);
