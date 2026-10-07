using UnityEngine;

public class NrsSceneBootstrap : MonoBehaviour
{
    private void Awake()
    {
        gameObject.AddComponent<NrsBootstrap>();
        gameObject.AddComponent<NrsMobileControls>();
    }
}
