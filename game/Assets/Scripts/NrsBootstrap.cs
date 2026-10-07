using System.Threading.Tasks;
using UnityEngine;

public class NrsBootstrap : MonoBehaviour
{
    public static NrsBootstrap Instance { get; private set; }

    // Production multiplayer endpoint.
    // The server remains authoritative; Unity sends input and receives snapshots.
    [SerializeField] private string serverUrl = "wss://nigeria-rp-production.up.railway.app";

    private NrsNetworkClient network;
    private NrsWorld world;

    public string ServerUrl => serverUrl;
    public NrsWorld World => world;

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        network = gameObject.AddComponent<NrsNetworkClient>();
        world = gameObject.AddComponent<NrsWorld>();
    }

    private async void Start()
    {
        await Task.Yield();
        await network.Connect(serverUrl, "Player");
    }

    public void SendInput(Vector2 movement) => network.SendInput(movement);
    public void Interact() => network.SendInteraction(null);
}
