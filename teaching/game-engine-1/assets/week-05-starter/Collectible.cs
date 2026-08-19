using UnityEngine;

public class Collectible : MonoBehaviour
{
    private bool collected;

    private void OnTriggerEnter2D(Collider2D other)
    {
        // TODO: 이미 수집했거나 Player가 아닌 경우에는 여기서 끝내세요.
        // TODO: 들어온 Collider2D에서 PlayerProgress를 찾으세요.
        // TODO: 수집을 한 번 기록하고 이 GameObject를 비활성화하세요.
    }
}
