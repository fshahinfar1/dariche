package ir.iust.computer.network.darichesignalling.model;

import lombok.Data;

@Data
public class SignallingMessage {
    private SignalType signalType;
    private Object data;
    private String destUserName;
}
