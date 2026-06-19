package com.chatplatform.core.controller;

import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.entity.BotAction;
import com.chatplatform.core.service.BotActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bots/{botId}/actions")
@RequiredArgsConstructor
public class BotActionController {

    private final BotActionService actionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BotAction>>> list(@PathVariable UUID botId) {
        return ResponseEntity.ok(ApiResponse.ok(actionService.listByBot(botId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BotAction>> create(
            @PathVariable UUID botId,
            @RequestBody CreateActionRequest req) {

        BotAction action = actionService.create(
                botId, req.name(), req.type(), req.triggerOn(), req.config());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(action));
    }

    @PatchMapping("/{actionId}")
    public ResponseEntity<ApiResponse<BotAction>> update(
            @PathVariable UUID botId,
            @PathVariable UUID actionId,
            @RequestBody UpdateActionRequest req) {

        BotAction action = actionService.update(
                actionId, req.name(), req.triggerOn(), req.config(), req.isActive());
        return ResponseEntity.ok(ApiResponse.ok(action));
    }

    record CreateActionRequest(String name, String type, String triggerOn, Map<String, Object> config) {}
    record UpdateActionRequest(String name, String triggerOn, Map<String, Object> config, Boolean isActive) {}

    @DeleteMapping("/{actionId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID botId,
            @PathVariable UUID actionId) {
        actionService.delete(actionId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
