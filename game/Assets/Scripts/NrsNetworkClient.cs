using System;
using NativeWebSocket;
using UnityEngine;

[Serializable]
public class NrsInputPayload
{
    public int sequence;
    public float forward;
    public float strafe;
}

[Serializable]
public class NrsInputMessage
{
    public string type = "input";
    public NrsInputPayload input = new NrsInputPayload();
}

public class NrsNetworkClient : MonoBehaviour
{
    private WebSocket socket;
    private int sequence;

    public event Action<string> MessageReceived;

    public async System.Threading.Tasks.Task Connect(string url, string playerName)
    {
        socket = new WebSocket(url);

        socket.OnOpen += () => SendJson("{\"type\":\"hello\",\"name\":\"" + playerName + "\"}");

        socket.OnMessage += bytes =>
        {
            var message = System.Text.Encoding.UTF8.GetString(bytes);
            MessageReceived?.Invoke(message);
        };

        socket.OnError += error => Debug.LogError("NRS WebSocket error: " + error);
        socket.OnClose += code => Debug.Log("NRS WebSocket closed: " + code);

        await socket.Connect();
    }

    public async void SendInput(Vector2 movement)
    {
        if (socket == null || socket.State != WebSocketState.Open) return;

        sequence++;

        var message = new NrsInputMessage();
        message.input.sequence = sequence;
        message.input.forward = movement.y;
        message.input.strafe = movement.x;

        await socket.SendText(JsonUtility.ToJson(message));
    }

    public async void SendInteraction(string targetId)
    {
        if (socket == null || socket.State != WebSocketState.Open) return;

        var message = string.IsNullOrEmpty(targetId)
            ? "{\"type\":\"interact\"}"
            : "{\"type\":\"interact\",\"targetId\":\"" + targetId + "\"}";

        await socket.SendText(message);
    }

    private void SendJson(string json) => _ = socket.SendText(json);

    private void Update()
    {
#if !UNITY_WEBGL || UNITY_EDITOR
        socket?.DispatchMessageQueue();
#endif
    }

    private async void OnDestroy()
    {
        if (socket != null) await socket.Close();
    }
}
