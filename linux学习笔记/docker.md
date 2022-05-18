# Docker 学习笔记

## docker的安装
> 解决每次运行docker命令都需要加 sudo 的情况：
> 1. 将用户添加到 docker 用户组
> 2. 重新登录shell
> 3. 重启 docker

## 什么是 Image（镜像）

## 什么是 Container（容器）
1. 通过 Image 创建（copy）
2. 在 Image layer之上建立一个 container layer（可读写）
3. Image负责app的存储和分发， Container负责运行app

```sh
# 列举当前本地正在运行的容器
docker container ls
# or
docker ps

# 列表本地所有容器
docker container ls -a
# or
docker ps -a
```

### 运行交互式容器
```sh
docker run -it <image name>

## run常用指令
# -a stdin: 指定标准输入输出内容类型，可选 STDIN/STDOUT/STDERR 三项；
# -d: 后台运行容器，并返回容器ID；
# -i: 以交互模式运行容器，通常与 -t 同时使用；
# -t: 为容器重新分配一个伪输入终端，通常与 -i 同时使用；
# --name="nginx-lb": 为容器指定一个名称；
# --dns 8.8.8.8: 指定容器使用的DNS服务器，默认和宿主一致；
# --dns-search example.com: 指定容器DNS搜索域名，默认和宿主一致；
# -h "mars": 指定容器的hostname；
# -e username="ritchie": 设置环境变量；
# --env-file=[]: 从指定文件读入环境变量；
# --cpuset="0-2" or --cpuset="0,1,2": 绑定容器到指定CPU运行；
# -m :设置容器使用内存最大值；
# --net="bridge": 指定容器的网络连接类型，支持 bridge/host/none/container: 四种类型；
# --link=[]: 添加链接到另一个容器；
```


## 构建Image
方式1：通过 docker container commit
方式2：通过 Dockerfile 文件构建

## Dockerfile 语法
FROM 关键字：尽量使用官方提供的 image
```sh
FROM scratch # 制作 base image
FROM centos # 使用base image
```

LABEL 关键字: 定义 image 的 metadata，一些描述信息【建议编写】
```sh
LABEL maintainer="XXX"
LABEL version="1.0"
LABEL description="这是一个 image"
```

RUN 关键字：执行命令并创建新的 Image Layer
最佳实践：
  1. 为了美观，复杂的RUN请用反斜线换行
  2. 避免无用分层，合并多条命令成一行
```sh
# 示例1: 反斜线换行
RUN yum update && yum install -y vim \
    python-dev

RUN apt-get update && apt-get install -y perl \
    pwgen --no-install-recommends && rm -rf \
    /var/lib/apt/lists/*

RUN /bin/bash -c 'source $HOME/.bashrc;echo $HOME'
```

WORKDIR 关键字：设置工作目录，没有则创建
最佳实践：
  1. 不要使用 RUN cd
  2. 不要使用相对目录，应该使用 绝对路径
```sh
# 示例
WORKDIR /test
WORKDIR demo
RUN pwd
```

ADD 和 COPY关键字：
  1. 都是本地添加文件到 根 目录
  2. ADD 能够解压缩
  3. 大部分情况，COPY 由于 ADD
  4. 添加远程文件/目录应使用  curl 或 wget
```sh
# 示例1
ADD hello / # 将 hello 这个文件添加到 根 目录

# 示例2
ADD test.tar.gz / # 将 test.tar.gz 添加到 根 目录 并解压

# 示例3
WORKDIR /root
ADD hello /  # 将 hello 添加到 /root/test/hello
# 作用同 示例3
WORKDIR /root
COPY hello
```

ENV关键字：设置常量
```sh
# 示例
ENV MYSQL_VERSION 5.6
RUN apt-get install -y mysql-server="${MYSQL_VERSION}" \ 
    && rm -rf /var/lib/apt/lists/*
```

VOLUME 和 EXPOSE：存储 和 网络
EXPOSE: 暴露一个端口
```sh
EXPOSE 5000
```

CMD 和 ENTRYPOINT
CMD 关键字：
  1. 设置容器启动后默认执行的命令和参数
  2. 如果 docker run 指定了其他命令，CMD 命令会被忽略
  3. 如果定义了多个CMD，只有最后一个 CMD 会被执行

ENTRYPOINT 关键字：设置容器启动时运行的命令 ·
  1. 让容器以应用程序或者服务的形式运行
  2. 不会被忽略，一定会被执行


## 发布Docker Image

## Dockerfile 实战
```sh
# 继承 python3.6 image
FROM python3.6
# 执行安装 flask 命令
RUN pip install flask
# 将 ./app.py 复制到 /app/app.py （注意 /app/ 不能写成 /app，否则意思为：将 ./app.py 复制到 / 的 app 文件中）
COPY app.py /app/
# 更改工作目录到 /app/
WORKDIR /app
# 执行 python app.py 命令，等同于：CMD python app.py
CMD ["python", "app.py"]
```
  