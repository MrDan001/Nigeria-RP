using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class NrsMobileControls : MonoBehaviour
{
    private NrsBootstrap bootstrap;

    private void Start()
    {
        bootstrap = NrsBootstrap.Instance;

        var canvasObject = new GameObject("NRS Mobile UI");
        var canvas = canvasObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasObject.AddComponent<CanvasScaler>();
        canvasObject.AddComponent<GraphicRaycaster>();

        if (FindFirstObjectByType<EventSystem>() == null)
        {
            var es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }

        CreateJoystick(canvasObject.transform);
        CreateInteractionButton(canvasObject.transform);
    }

    private void CreateJoystick(Transform parent)
    {
        var baseObject = new GameObject("Movement Joystick");
        baseObject.transform.SetParent(parent, false);

        var image = baseObject.AddComponent<Image>();
        image.color = new Color(1f, 1f, 1f, 0.14f);

        var rect = baseObject.GetComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.zero;
        rect.pivot = Vector2.zero;
        rect.anchoredPosition = new Vector2(40, 50);
        rect.sizeDelta = new Vector2(180, 180);

        var handleObject = new GameObject("Handle");
        handleObject.transform.SetParent(baseObject.transform, false);

        var handle = handleObject.AddComponent<Image>();
        handle.color = new Color(1f, 1f, 1f, 0.35f);

        var handleRect = handle.GetComponent<RectTransform>();
        handleRect.anchorMin = handleRect.anchorMax = new Vector2(0.5f, 0.5f);
        handleRect.pivot = new Vector2(0.5f, 0.5f);
        handleRect.sizeDelta = new Vector2(75, 75);

        var drag = baseObject.AddComponent<NrsJoystickDrag>();
        drag.Initialize(this, rect, handleRect, 90f);
    }

    private void CreateInteractionButton(Transform parent)
    {
        var buttonObject = new GameObject("Interact");
        buttonObject.transform.SetParent(parent, false);

        var image = buttonObject.AddComponent<Image>();
        image.color = new Color(0.25f, 0.8f, 0.55f, 0.85f);

        var button = buttonObject.AddComponent<Button>();
        button.onClick.AddListener(bootstrap.Interact);

        var rect = buttonObject.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(1, 0);
        rect.anchorMax = new Vector2(1, 0);
        rect.pivot = new Vector2(1, 0);
        rect.anchoredPosition = new Vector2(-45, 55);
        rect.sizeDelta = new Vector2(130, 70);
    }

    public void SetMovement(Vector2 value) => bootstrap.SendInput(value);
}

public class NrsJoystickDrag : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
{
    private NrsMobileControls controls;
    private RectTransform baseRect;
    private RectTransform handleRect;
    private float radius;

    public void Initialize(NrsMobileControls owner, RectTransform baseTransform, RectTransform handleTransform, float joystickRadius)
    {
        controls = owner;
        baseRect = baseTransform;
        handleRect = handleTransform;
        radius = joystickRadius;
    }

    public void OnPointerDown(PointerEventData eventData) => UpdatePosition(eventData);
    public void OnDrag(PointerEventData eventData) => UpdatePosition(eventData);

    public void OnPointerUp(PointerEventData eventData)
    {
        handleRect.anchoredPosition = Vector2.zero;
        controls.SetMovement(Vector2.zero);
    }

    private void UpdatePosition(PointerEventData eventData)
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            baseRect,
            eventData.position,
            eventData.pressEventCamera,
            out var local);

        var value = Vector2.ClampMagnitude(local / radius, 1f);
        handleRect.anchoredPosition = value * radius;
        controls.SetMovement(value);
    }
}
