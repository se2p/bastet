program Mini1Program

actor MiniActor is RuntimeEntity begin

    script on startup do begin
        assume true
        _RUNTIME_signalFailure()
    end

end

