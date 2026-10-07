using UnityEngine;

public class NrsCamera : MonoBehaviour
{
    private Transform target;

    private void LateUpdate()
    {
        if (target == null)
        {
            var local = GameObject.Find("Local Player");
            if (local != null) target = local.transform;
        }

        if (target == null) return;

        var desired = target.position + new Vector3(0f, 7f, -8f);
        transform.position = Vector3.Lerp(transform.position, desired, Time.deltaTime * 8f);
        transform.LookAt(target.position + Vector3.up);
    }
}
