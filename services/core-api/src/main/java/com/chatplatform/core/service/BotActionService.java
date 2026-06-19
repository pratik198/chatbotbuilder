package com.chatplatform.core.service;

import com.chatplatform.core.entity.BotAction;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.BotActionRepository;
import com.chatplatform.core.repository.BotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BotActionService {

    private final BotActionRepository actionRepo;
    private final BotRepository botRepo;

    public List<BotAction> listByBot(UUID botId) {
        return actionRepo.findByBotId(botId);
    }

    @Transactional
    public BotAction create(UUID botId, String name, String type,
                            String triggerOn, Map<String, Object> config) {
        if (!botRepo.existsById(botId)) {
            throw new ResourceNotFoundException("Bot", botId);
        }
        return actionRepo.save(BotAction.builder()
                .botId(botId)
                .name(name)
                .type(type)
                .triggerOn(triggerOn != null ? triggerOn : "lead_captured")
                .config(config != null ? config : Map.of())
                .build());
    }

    @Transactional
    public BotAction update(UUID actionId, String name, String triggerOn,
                            Map<String, Object> config, Boolean isActive) {
        BotAction action = actionRepo.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("BotAction", actionId));
        if (name != null)      action.setName(name);
        if (triggerOn != null) action.setTriggerOn(triggerOn);
        if (config != null)    action.setConfig(config);
        if (isActive != null)  action.setActive(isActive);
        return actionRepo.save(action);
    }

    @Transactional
    public void delete(UUID actionId) {
        if (!actionRepo.existsById(actionId)) {
            throw new ResourceNotFoundException("BotAction", actionId);
        }
        actionRepo.deleteById(actionId);
    }
}
