using UnityEngine;

public class PlayerProgress : MonoBehaviour
{
    [SerializeField, Min(1)]
    private int requiredCollectibles = 3;

    private int collectedCount;
    private Rigidbody2D body;
    private Vector2 startPosition;

    private void Awake()
    {
        // TODO: 같은 GameObject의 Rigidbody2D를 body에 저장하세요.
    }

    private void Start()
    {
        // TODO: 시작 위치에는 body.position을 저장하세요.
    }

    public void AddCollectible()
    {
        // TODO: collectedCount를 1 늘리고 현재 진행도를 Console에 기록하세요.
    }

    public bool HasAllCollectibles()
    {
        // TODO: collectedCount가 requiredCollectibles에 도달했는지 반환하세요.
        return false;
    }

    public void ResetToStart()
    {
        // TODO: 속도를 없애려면 body.linearVelocity를 0으로 만들고 body.position을 startPosition으로 옮기세요.
    }
}
