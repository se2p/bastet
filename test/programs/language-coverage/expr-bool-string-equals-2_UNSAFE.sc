program Mini1Program

actor MiniActor is RuntimeEntity begin

    script on startup do begin
        if "abc" = "abc" then begin
            _RUNTIME_signalFailure()
        end
    end

end

