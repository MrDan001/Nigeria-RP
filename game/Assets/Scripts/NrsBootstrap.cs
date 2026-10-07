using System.Threading.Tasks;
using UnityEngine;

public class NrsBootstrap : MonoBehaviour
{
    public static NrsBootstrap Instance { get; private set; }

    [SerializeField] private string serverUrl = "ws://127.0.0.1:8080";

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
