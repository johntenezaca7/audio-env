using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class test_script : MonoBehaviour {
	public AudioClip audioClip;

    float timeBetweenShots;
    float timer;
    Random rnd;
    Vector3 myVector;

	// Use this for initialization
	void Start () {
		Time.timeScale = 1.0f;
		timeBetweenShots = 2.0f;
		myVector = new Vector3(0.5f, 0.5f, 0.5f);
	}

    void Update()
    {
        timer += Time.deltaTime;
        if (timer > timeBetweenShots)
        {
            AudioSource.PlayClipAtPoint(audioClip, myVector, 1.0f);
            timeBetweenShots = Random.Range(2,15);
            timer = 0.0f;
        }
    }
}
