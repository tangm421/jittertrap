PROG = toptalk

SRC = main.c
HEADERS = decode.h

LIBS = -lpcap

CFLAGS = -g -Wall

all: $(SRC) $(HEADERS) Makefile
	gcc -o $(PROG) $(SRC) $(LIBS) $(CFLAGS)
