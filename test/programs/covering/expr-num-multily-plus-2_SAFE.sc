program Mini1Program

actor MiniActor is RuntimeEntity begin

    script on startup do begin
        if 6 = 2 * 2 + 2 then begin
        end else begin
            _RUNTIME_signalFailure()
        end
    end

end

