package ir.iust.computer.network.darichesignalling.model;

import lombok.Data;

@Data
public class SignallingMessage {
    private SignalType signalType;
    private String data;
    private String destUserName;
}
