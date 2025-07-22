
import mitt from 'mitt';

/**
 * 事件管理
 */
export default new (class Event {
    /**
     * @property
     * @private
     * @type {import('mitt').Emitter}
     */
    emitter = mitt();

    /**
     * 注册监听事件
     * @param {string} instanceId 接收消息的频道
     * @param {string} event 要注册监听的事件
     * @param {(event: any) => void} handler 事件回调
     */
    on(instanceId, event, handler) {
        // console.warn('事件注册', `${instanceId}:${event}`);
        this.emitter.on(`${instanceId}:${event}`, handler);
    }

    /**
     * 触发事件
     * @param {string} instanceId 发送消息的频道
     * @param {string} event 要触发的事件
     * @param {any} param 触发时传入的参数
     */
    emit(instanceId, event, ...param) {
        // console.warn('事件触发', `${instanceId}:${event}`, param);
        this.emitter.emit(`${instanceId}:${event}`, param);
    }

    off(instanceId, event, handler) {
        this.emitter.off(`${instanceId}:${event}`, handler);
    }
})();
