using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class NrsPlayerState
{
    public string id;
    public string name;
    public float x;
    public float z;
    public float yaw;
}

[Serializable]
public class NrsSnapshot
{
    public string type;
    public long serverTime;
    public NrsPlayerState[] players;
}

[Serializable]
public class NrsConnected
{
    public string type;
    public int protocolVersion;
    public string playerId;
    public int serverTickRate;
    public NrsPlayerState[] players;
}

public class NrsWorld : MonoBehaviour
{
    private readonly Dictionary<string, GameObject> avatars = new();
    private NrsNetworkClient network;
    private string localPlayerId;

    private void Awake()
    {
        network = GetComponent<NrsNetworkClient>();
        network.MessageReceived += OnMessage;
    }

    private void Start() => BuildLaboratory();

    private void BuildLaboratory()
    {
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "NRS Laboratory Ground";
        ground.transform.localScale = new Vector3(10f, 1f, 10f);

        var lightObject = new GameObject("Laboratory Light");
        var light = lightObject.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1.1f;
        light.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        var cameraObject = new GameObject("Main Camera");
        cameraObject.tag = "MainCamera";
        cameraObject.AddComponent<Camera>();
        cameraObject.AddComponent<NrsCamera>();
        cameraObject.transform.position = new Vector3(0f, 7f, -8f);
        cameraObject.transform.rotation = Quaternion.Euler(35f, 0f, 0f);
    }

    private void OnMessage(string json)
    {
        if (json.Contains("\"type\":\"connected\""))
        {
            var message = JsonUtility.FromJson<NrsConnected>(json);
            localPlayerId = message.playerId;
            ApplyPlayers(message.players);
        }
        else if (json.Contains("\"type\":\"snapshot\""))
        {
            var message = JsonUtility.FromJson<NrsSnapshot>(json);
            ApplyPlayers(message.players);
        }
    }

    private void ApplyPlayers(NrsPlayerState[] states)
    {
        if (states == null) return;

        var seen = new HashSet<string>();

        foreach (var state in states)
        {
            seen.Add(state.id);

            if (!avatars.TryGetValue(state.id, out var avatar))
            {
                avatar = CreateAvatar(state);
                avatars[state.id] = avatar;
            }

            avatar.transform.position = new Vector3(state.x, 1f, state.z);
            avatar.transform.rotation = Quaternion.Euler(0f, state.yaw, 0f);
        }

        foreach (var pair in new List<KeyValuePair<string, GameObject>>(avatars))
        {
            if (!seen.Contains(pair.Key))
            {
                Destroy(pair.Value);
                avatars.Remove(pair.Key);
            }
        }
    }

    private GameObject CreateAvatar(NrsPlayerState state)
    {
        var avatar = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        avatar.name = state.id == localPlayerId ? "Local Player" : "Remote Player";
        avatar.transform.position = new Vector3(state.x, 1f, state.z);
        return avatar;
    }
}
