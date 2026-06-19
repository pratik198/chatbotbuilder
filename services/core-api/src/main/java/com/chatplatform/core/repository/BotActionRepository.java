package com.chatplatform.core.repository;

import com.chatplatform.core.entity.BotAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BotActionRepository extends JpaRepository<BotAction, UUID> {
    List<BotAction> findByBotId(UUID botId);
    List<BotAction> findByBotIdAndIsActiveTrue(UUID botId);
    List<BotAction> findByBotIdAndTriggerOn(UUID botId, String triggerOn);
}
